import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      // Scroll all possible scrollable elements
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Also try scrolling the main element if it exists
      const main = document.querySelector('main');
      if (main) {
        main.scrollTop = 0;
      }
    });
  }, [pathname]);

  return null;
}

