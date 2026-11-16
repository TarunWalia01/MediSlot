import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="site-footer">
      <Link className="site-brand" to="/">MediSlot</Link>
      <p>Simple, convenient access to doctor appointments.</p>
      <nav aria-label="Footer navigation">
        <Link to="/doctors">Find a doctor</Link>
        <Link to="/services">Services</Link>
        <Link to="/login">Log in</Link>
      </nav>
    </footer>
  );
}

export default Footer;
