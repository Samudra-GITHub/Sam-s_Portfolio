import Filmstrip from '../components/home/Filmstrip';

/** The homepage is an introduction, not an archive: who, what, and how he works, on one strip of film. The work lives on /projects. */
export default function Home() {
  return (
    <main id="main" className="home">
      <Filmstrip />
    </main>
  );
}
