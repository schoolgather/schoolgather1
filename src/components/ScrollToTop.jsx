import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (hash) {
      const rawId = hash.slice(1);
      const el = document.getElementById(rawId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    if (navType !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, navType]);

  return null;
}
