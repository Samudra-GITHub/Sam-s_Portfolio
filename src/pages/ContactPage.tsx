import Contact from '../components/contact/Contact';
import './pages.css';

/** /contact: the final chapter, standalone. Same rows, same links, no detour. */
export default function ContactPage() {
  return (
    <main id="main" className="pg pg-contact">
      <Contact />
    </main>
  );
}
