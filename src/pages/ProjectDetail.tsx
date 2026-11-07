import { useParams } from 'react-router-dom';
import { getProject } from '../data/projects';
import StudioProject from '../studio/StudioProject';
import NotFound from './NotFound';

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = getProject(slug);
  return project ? <StudioProject key={project.slug} project={project} /> : <NotFound />;
}
