import { motion } from "framer-motion";
import { Shield, Lock, Award, CheckCircle, CreditCard, Globe } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";
import { useEffect, useRef } from "react";
import { Swiper } from "swiper";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const certifications = [
  { icon: Shield, label: "PCI-DSS Compliant", description: "Payment card security" },
  { icon: Lock, label: "GDPR Ready", description: "Data protection" },
  { icon: Award, label: "SOC 2 Type II", description: "Security certified" },
  { icon: CheckCircle, label: "ISO 27001", description: "Information security" },
];

// Popular international mobile network providers with eSIM support
// Logos are stored locally in /public/logos/
const mobileProviders = [
  { name: "T-Mobile", country: "USA", logo: "/logos/t-mobile.svg" },
  { name: "Vodafone", country: "UK/Europe", logo: "/logos/vodafone.svg" },
  { name: "Orange", country: "France", logo: "/logos/orange.svg" },
  { name: "EE", country: "UK", logo: "/logos/ee.svg" },
  { name: "Three", country: "UK/Hong Kong", logo: "/logos/three.svg" },
  { name: "O2", country: "UK/Europe", logo: "/logos/o2.svg" },
  { name: "Airtel", country: "India", logo: "/logos/airtel.svg" },
  { name: "Jio", country: "India", logo: "/logos/jio.svg" },
  { name: "SoftBank", country: "Japan", logo: "/logos/softbank.svg" },
  { name: "NTT Docomo", country: "Japan", logo: "/logos/ntt-docomo.svg" },
  { name: "Telstra", country: "Australia", logo: "/logos/telstra.svg" },
  { name: "Optus", country: "Australia", logo: "/logos/optus.svg" },
  { name: "Rogers", country: "Canada", logo: "/logos/rogers.svg" },
  { name: "Bell", country: "Canada", logo: "/logos/bell.svg" },
  { name: "TIM", country: "Italy", logo: "/logos/tim.svg" },
  { name: "Movistar", country: "Spain/Latin America", logo: "/logos/movistar.svg" },
  { name: "Claro", country: "Latin America", logo: "/logos/claro.svg" },
  { name: "Globe", country: "Philippines", logo: "/logos/globe.svg" },
  { name: "Singtel", country: "Singapore", logo: "/logos/singtel.svg" },
  { name: "StarHub", country: "Singapore", logo: "/logos/starhub.svg" },
];

export function TrustBadges() {
  const rtlSliderRef = useRef<HTMLDivElement>(null);
  const ltrSliderRef = useRef<HTMLDivElement>(null);
  const slidersRef = useRef<Swiper[]>([]);

  useEffect(() => {
    const isDesktop = () => window.innerWidth > 767.9;
    let gap = 15;

    if (isDesktop()) gap = 0.0285 * window.innerWidth;

    const sliders: Swiper[] = [];

    if (rtlSliderRef.current && ltrSliderRef.current) {
      // Initialize RTL slider
      const rtlSlider = new Swiper(rtlSliderRef.current, {
        modules: [Autoplay],
        loop: true,
        slidesPerView: "auto",
        spaceBetween: gap,
        speed: 8000,
        allowTouchMove: false,
        autoplay: {
          delay: 0,
          reverseDirection: true,
          disableOnInteraction: false,
        },
      });

      // Initialize LTR slider
      const ltrSlider = new Swiper(ltrSliderRef.current, {
        modules: [Autoplay],
        loop: true,
        slidesPerView: "auto",
        spaceBetween: gap,
        speed: 8000,
        allowTouchMove: false,
        autoplay: {
          delay: 0,
          reverseDirection: false,
          disableOnInteraction: false,
        },
      });

      sliders.push(rtlSlider, ltrSlider);
      slidersRef.current = sliders;

      const handleResize = () => {
        const newGap = isDesktop() ? 0.0285 * window.innerWidth : 15;
        sliders.forEach((slider) => {
          slider.params.spaceBetween = newGap;
          slider.update();
        });
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        sliders.forEach((slider) => slider.destroy());
      };
    }
  }, []);

  return (
    <section className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Trusted & Secure
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Enterprise-Grade Security & Trust
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of businesses who trust eSIMLaunch with their eSIM operations
          </p>
        </motion.div>

        {/* Trust Counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-8 md:gap-16 mb-16"
        >
          <div className="text-center">
            <div className="font-display text-4xl md:text-5xl font-bold gradient-text">
              <AnimatedCounter value={2500} suffix="+" />
            </div>
            <p className="text-muted-foreground mt-1">Businesses Trust Us</p>
          </div>
          <div className="text-center">
            <div className="font-display text-4xl md:text-5xl font-bold gradient-text">
              <AnimatedCounter value={99.9} suffix="%" decimals={1} />
            </div>
            <p className="text-muted-foreground mt-1">Uptime SLA</p>
          </div>
          <div className="text-center">
            <div className="font-display text-4xl md:text-5xl font-bold gradient-text">
              <AnimatedCounter value={10} suffix="M+" />
            </div>
            <p className="text-muted-foreground mt-1">eSIMs Processed</p>
          </div>
        </motion.div>

        {/* Security Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {certifications.map((cert, index) => (
            <motion.div
              key={cert.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 text-center shadow-sm border border-border hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <cert.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{cert.label}</h3>
              <p className="text-xs text-muted-foreground">{cert.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Press Mentions - Horizontal Ticker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-center text-2xl md:text-3xl font-display font-bold mb-4">
            A World of Trusted Brands
          </h1>
          <div className="text-center text-sm text-muted-foreground mb-8">
            The power of partnership connecting you globally
          </div>

          <div className="horizontal-ticker">
            {/* Horizontal Ticker: Slider RTL */}
            <div ref={rtlSliderRef} className="swiper horizontal-ticker__slider">
              <div className="swiper-wrapper">
                {mobileProviders.slice(0, 10).map((provider, index) => (
                  <div key={`rtl-${index}`} className="swiper-slide horizontal-ticker__slide">
                    <div className={`provider-logo ${!provider.logo ? 'provider-logo-text-only' : ''}`}>
                      {provider.logo && (
                        <img 
                          src={provider.logo} 
                          alt={provider.name}
                          className="provider-logo-img"
                          onError={(e) => {
                            // Fallback to text if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.classList.add('provider-logo-text-only');
                            }
                          }}
                        />
                      )}
                      <span className="provider-name">{provider.name}</span>
                    </div>
                  </div>
                ))}
                {/* slides copies for seamless loop */}
                {mobileProviders.slice(0, 10).map((provider, index) => (
                  <div key={`rtl-copy-${index}`} className="swiper-slide horizontal-ticker__slide">
                    <div className={`provider-logo ${!provider.logo ? 'provider-logo-text-only' : ''}`}>
                      {provider.logo && (
                        <img 
                          src={provider.logo} 
                          alt={provider.name}
                          className="provider-logo-img"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.classList.add('provider-logo-text-only');
                            }
                          }}
                        />
                      )}
                      <span className="provider-name">{provider.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Horizontal Ticker: Slider LTR */}
            <div ref={ltrSliderRef} className="swiper horizontal-ticker__slider">
              <div className="swiper-wrapper">
                {mobileProviders.slice(10).map((provider, index) => (
                  <div key={`ltr-${index}`} className="swiper-slide horizontal-ticker__slide">
                    <div className={`provider-logo ${!provider.logo ? 'provider-logo-text-only' : ''}`}>
                      {provider.logo && (
                        <img 
                          src={provider.logo} 
                          alt={provider.name}
                          className="provider-logo-img"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.classList.add('provider-logo-text-only');
                            }
                          }}
                        />
                      )}
                      <span className="provider-name">{provider.name}</span>
                    </div>
                  </div>
                ))}
                {/* slides copies for seamless loop */}
                {mobileProviders.slice(10).map((provider, index) => (
                  <div key={`ltr-copy-${index}`} className="swiper-slide horizontal-ticker__slide">
                    <div className={`provider-logo ${!provider.logo ? 'provider-logo-text-only' : ''}`}>
                      {provider.logo && (
                        <img 
                          src={provider.logo} 
                          alt={provider.name}
                          className="provider-logo-img"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.classList.add('provider-logo-text-only');
                            }
                          }}
                        />
                      )}
                      <span className="provider-name">{provider.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
