import Exposure from '../components/home/Exposure';

/** The homepage is an introduction, not an archive: who, what, and what he cares about. The work lives on /projects. */
export default function Home() {
  return (
    <main id="main" className="home">
      <Exposure />
    </main>
  );
}
