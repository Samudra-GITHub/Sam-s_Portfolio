"""Scripted sculpt and bake for the hero mountain (Blender 5.x, run headless).

    blender -b -P art/hero-island/sculpt.py -- [voxel] [tex]

Input : art/hero-island/rock_base.ply   (from scripts/export-hero.mjs; three.js Y-up)
Output: public/world/hero/rock_lod0.glb  (~60k tris: positions, normals, UV, AO in COLOR_0)
        public/world/hero/rock_lod1.glb  (~20k tris, phones)
        public/world/hero/rock_normal.jpg (object-space normals, Blender axes)

The sculpt works on the high-res copy only, and only on steep faces, so the
plateau, river channels and waterfall lips the scene relies on stay put:
  1. fracture: Voronoi cells over the cliff surface, each flattened toward its
     own plane and stepped in or out a little -> chiselled faces with cracks
     between them, at two scales;
  2. ledge lips: the strata beds get a crisp overhanging lip at the top of each;
  3. erosion relief: fractal displacement along the normal.
Then the high mesh is baked down onto a decimated, UV-unwrapped low mesh.
"""
import math
import os
import sys
import time

import bmesh
import bpy
import numpy as np
from mathutils.kdtree import KDTree

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
VOXEL = float(argv[0]) if len(argv) > 0 else 0.2
TEX = int(argv[1]) if len(argv) > 1 else 2048
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "public", "world", "hero")
os.makedirs(OUT, exist_ok=True)
T0 = time.time()


def log(msg):
    print(f"[sculpt {time.time() - T0:6.1f}s] {msg}", flush=True)


# ---------------------------------------------------------------- noise (numpy)
def vnoise(p, seed=0):
    pi = np.floor(p).astype(np.int64)
    f = p - pi
    w = f * f * (3 - 2 * f)

    def h(dx, dy, dz):
        x, y, z = pi[:, 0] + dx, pi[:, 1] + dy, pi[:, 2] + dz
        n = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791) ^ (seed * 2654435761)
        n = (n ^ (n >> 13)) * 1274126177
        n = n ^ (n >> 16)
        return (n & 0xFFFF).astype(np.float64) / 65535.0

    def lerp(a, b, t):
        return a + (b - a) * t

    x0 = lerp(lerp(h(0, 0, 0), h(1, 0, 0), w[:, 0]), lerp(h(0, 1, 0), h(1, 1, 0), w[:, 0]), w[:, 1])
    x1 = lerp(lerp(h(0, 0, 1), h(1, 0, 1), w[:, 0]), lerp(h(0, 1, 1), h(1, 1, 1), w[:, 0]), w[:, 1])
    return lerp(x0, x1, w[:, 2]) * 2 - 1


def fbm(p, seed=0, octaves=4):
    s, a, f, norm = 0.0, 0.5, 1.0, 0.0
    for i in range(octaves):
        s = s + vnoise(p * f, seed + i * 17) * a
        norm += a
        a *= 0.5
        f *= 2.03
    return s / norm


# ---------------------------------------------------------------- mesh helpers
def get_arrays(me):
    n = len(me.vertices)
    co = np.empty(n * 3)
    me.vertices.foreach_get("co", co)
    me.update()
    nor = np.empty(n * 3)
    me.vertices.foreach_get("normal", nor)
    return co.reshape(-1, 3), nor.reshape(-1, 3)


def set_co(me, co):
    me.vertices.foreach_set("co", co.ravel())
    me.update()


def select_only(*objs, active=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]


def apply_mod(obj, mod):
    select_only(obj)
    bpy.ops.object.modifier_apply(modifier=mod.name)


# ---------------------------------------------------------------- 0. scene
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.ply_import(filepath=os.path.join(HERE, "rock_base.ply"), forward_axis="NEGATIVE_Z", up_axis="Y")
base = bpy.context.selected_objects[0]
base.name = "rock_base"
# the importer keeps the Y-up data and adds a 90-degree object rotation; bake it in, so mesh data is Z-up
select_only(base)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
log(f"imported {len(base.data.vertices)} verts")

# ---------------------------------------------------------------- 1. high-res copy
hi = base.copy()
hi.data = base.data.copy()
hi.name = "rock_hi"
bpy.context.collection.objects.link(hi)
m = hi.modifiers.new("remesh", "REMESH")
m.mode = "VOXEL"
m.voxel_size = VOXEL
m.adaptivity = 0.0
apply_mod(hi, m)
log(f"remeshed: {len(hi.data.vertices)} verts")

co, nor = get_arrays(hi.data)
steep = np.clip(1.0 - (np.abs(nor[:, 2]) - 0.45) / 0.35, 0.0, 1.0)  # 1 on cliffs, 0 on flat ground
rng = np.random.default_rng(41)

# ---------------------------------------------------------------- 2. fracture planes
for scale, flatten, step in ((7.5, 0.8, 0.55), (2.8, 0.6, 0.22)):
    idx = np.nonzero(steep > 0.05)[0]
    keys = np.floor((co[idx] + rng.uniform(0, scale, 3)) / scale).astype(np.int64)
    _, first = np.unique(keys, axis=0, return_index=True)
    seeds = co[idx[first]] + rng.normal(0, scale * 0.25, (len(first), 3))
    kd = KDTree(len(seeds))
    for i, s in enumerate(seeds):
        kd.insert(s, i)
    kd.balance()
    cell = np.empty(len(idx), dtype=np.int64)
    for j, vi in enumerate(idx):
        cell[j] = kd.find(co[vi])[1]
    k = len(seeds)
    cnt = np.bincount(cell, minlength=k).astype(np.float64)[:, None]
    cen = np.zeros((k, 3)); np.add.at(cen, cell, co[idx]); cen /= np.maximum(cnt, 1)
    pn = np.zeros((k, 3)); np.add.at(pn, cell, nor[idx]); pn /= np.maximum(np.linalg.norm(pn, axis=1, keepdims=True), 1e-6)
    # tilt every facet a little at random: real fracture planes do not follow the mean surface
    pn = pn + rng.normal(0, 0.18, pn.shape)
    pn /= np.linalg.norm(pn, axis=1, keepdims=True)
    off = rng.uniform(-step, step, k) * (rng.uniform(0, 1, k) < 0.7)
    d = np.einsum("ij,ij->i", co[idx] - cen[cell], pn[cell])
    w = steep[idx] * flatten
    co[idx] -= (w * d)[:, None] * pn[cell]
    co[idx] += (steep[idx] * off[cell])[:, None] * pn[cell]
    log(f"fracture scale {scale}: {k} facets")
set_co(hi.data, co)

# ---------------------------------------------------------------- 3. ledge lips on the strata
co, nor = get_arrays(hi.data)
steep = np.clip(1.0 - (np.abs(nor[:, 2]) - 0.45) / 0.35, 0.0, 1.0)
hn = nor.copy(); hn[:, 2] = 0
hn /= np.maximum(np.linalg.norm(hn, axis=1, keepdims=True), 1e-6)
bed = co[:, 2] / 2.4 + 0.45 * fbm(co * 0.04, 7, 3) + 0.08 * co[:, 0] / 30.0
saw = bed - np.floor(bed)
lip = 0.55 * np.power(saw, 4) - 0.12  # out at the top of each bed, recessed below
co += (steep * lip)[:, None] * hn
set_co(hi.data, co)
log("ledge lips")

# ---------------------------------------------------------------- 4. erosion relief
co, nor = get_arrays(hi.data)
steep = np.clip(1.0 - (np.abs(nor[:, 2]) - 0.45) / 0.35, 0.0, 1.0)
big = fbm(co * 0.09, 11, 4)
ridged = 1.0 - np.abs(fbm(co * 0.35, 13, 3))
amp = 0.25 + 0.55 * steep
co += (nor.T * ((big * 0.55 + (ridged - 0.5) * 0.35) * amp)).T
set_co(hi.data, co)
bm = bmesh.new(); bm.from_mesh(hi.data); bm.normal_update(); bm.to_mesh(hi.data); bm.free()
log("erosion relief")

# ---------------------------------------------------------------- 5. low mesh + UVs
def make_low(name, tris):
    lo = hi.copy()
    lo.data = hi.data.copy()
    lo.name = name
    bpy.context.collection.objects.link(lo)
    cur = sum(len(p.vertices) - 2 for p in lo.data.polygons)
    dm = lo.modifiers.new("dec", "DECIMATE")
    dm.decimate_type = "COLLAPSE"
    dm.ratio = min(1.0, tris / cur)
    apply_mod(lo, dm)
    select_only(lo)
    bpy.ops.object.shade_smooth()
    return lo


lo0 = make_low("rock_lod0", 60000)
select_only(lo0)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003)
bpy.ops.object.mode_set(mode="OBJECT")
log(f"lod0: {len(lo0.data.polygons)} faces, unwrapped")

# ---------------------------------------------------------------- 6. bake
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 24
bake = scene.render.bake
bake.use_selected_to_active = True
bake.cage_extrusion = 1.6
bake.max_ray_distance = 4.0
bake.margin = 8

img = bpy.data.images.new("rock_normal", TEX, TEX, alpha=False, float_buffer=False)
img.colorspace_settings.name = "Non-Color"
mat = bpy.data.materials.new("rock_bake")
mat.use_nodes = True
node = mat.node_tree.nodes.new("ShaderNodeTexImage")
node.image = img
mat.node_tree.nodes.active = node
lo0.data.materials.append(mat)

select_only(hi, lo0, active=lo0)
bpy.ops.object.bake(type="NORMAL", normal_space="OBJECT")
# WebP for the site (about a third of the JPEG); a quality loss of this size is invisible under the paint pass
scene_settings = bpy.context.scene.render.image_settings
img.filepath_raw = os.path.join(OUT, "rock_normal.webp")
img.file_format = "WEBP"
scene_settings.quality = 82
img.save(quality=82)
log("baked object-space normals")

ao = lo0.data.color_attributes.new("AO", "BYTE_COLOR", "POINT")
lo0.data.color_attributes.active_color = ao
bake.target = "VERTEX_COLORS"
select_only(hi, lo0, active=lo0)
bpy.ops.object.bake(type="AO")
log("baked AO to vertex colours")

# phones: a lighter copy of the baked low mesh (UVs and AO come along)
lo1 = lo0.copy(); lo1.data = lo0.data.copy(); lo1.name = "rock_lod1"
bpy.context.collection.objects.link(lo1)
dm = lo1.modifiers.new("dec", "DECIMATE"); dm.decimate_type = "COLLAPSE"; dm.ratio = 20000 / max(1, len(lo0.data.polygons))
apply_mod(lo1, dm)


# ---------------------------------------------------------------- 7. export
def export(obj, path):
    select_only(obj)
    kw = dict(filepath=path, use_selection=True, export_format="GLB", export_normals=True,
              export_texcoords=True, export_materials="NONE", export_yup=True, export_apply=True,
              export_meshopt_compression_enable=True)
    for extra in (dict(export_vertex_color="ACTIVE"), dict(export_colors=True), {}):
        try:
            bpy.ops.export_scene.gltf(**kw, **extra)
            return
        except TypeError:
            continue


export(lo0, os.path.join(OUT, "rock_lod0.glb"))
export(lo1, os.path.join(OUT, "rock_lod1.glb"))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "hero_rock.blend"))
log(f"exported: lod0 {len(lo0.data.polygons)} faces, lod1 {len(lo1.data.polygons)} faces")
