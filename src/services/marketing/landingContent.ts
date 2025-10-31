import { DEFAULT_LOCALE, type SupportedLocale } from "@/src/lib/locale/constants";
import { normalizeLocale } from "@/src/lib/locale/utils";

export type BenefitIconId =
  | "insights"
  | "acquisition"
  | "retention"
  | "mobile"
  | "automation"
  | "darkmode";

export interface LandingNavLink {
  label: string;
  href: string;
}

export interface LandingHeroContent {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: LandingAction;
  secondaryAction: LandingAction;
  trustedBy: string;
  trustLogos: Array<{
    name: string;
    image: string;
    alt: string;
  }>;
  heroImage: {
    src: string;
    alt: string;
  };
}

export interface LandingBenefit {
  title: string;
  description: string;
  image: {
    src: string;
    alt: string;
  };
  bullets: Array<{
    title: string;
    description: string;
    icon: BenefitIconId;
  }>;
}

export interface LandingVideoContent {
  title: string;
  description: string;
  videoId: string;
}

export interface LandingTestimonial {
  quote: string;
  highlight: string;
  name: string;
  role: string;
  avatar: {
    src: string;
    alt: string;
  };
}

export interface LandingFaqItem {
  question: string;
  answer: string;
}

export interface LandingCtaContent {
  title: string;
  description: string;
  primaryAction: LandingAction;
  secondaryAction?: LandingAction;
}

export interface LandingFooterContent {
  copyright: string;
  links: LandingNavLink[];
}

export interface LandingAction {
  label: string;
  href: string;
}

export interface LandingPageContent {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    logo: {
      src: string;
      alt: string;
    };
    links: LandingNavLink[];
    cta: LandingAction;
  };
  hero: LandingHeroContent;
  benefits: LandingBenefit[];
  video: LandingVideoContent;
  testimonials: LandingTestimonial[];
  faq: LandingFaqItem[];
  cta: LandingCtaContent;
  footer: LandingFooterContent;
}

const CONTENT_BY_LOCALE: Record<SupportedLocale, LandingPageContent> = {
  en: {
    meta: {
      title: "IslandiaAI | Intelligent finance workflows for distributors",
      description:
        "Streamline supplier and customer operations with AI-assisted workflows across orders, invoices, and reconciliation.",
    },
    nav: {
      logo: {
        src: "/marketing/nextly/logo.svg",
        alt: "IslandiaAI logo",
      },
      links: [
        { label: "Features", href: "#features" },
        { label: "Automation", href: "#automation" },
        { label: "Customer Stories", href: "#testimonials" },
        { label: "FAQ", href: "#faq" },
      ],
      cta: {
        label: "Go to Dashboard",
        href: "/signin",
      },
    },
    hero: {
      eyebrow: "IslandiaAI for Revenue Teams",
      title: "Your whole order lifecycle, finally in sync.",
      description:
        "Unify supplier, product request, and invoice workflows in one AI-assisted workspace that speaks your team’s language.",
      primaryAction: {
        label: "Start Free Trial",
        href: "/signup",
      },
      secondaryAction: {
        label: "See Product Tour",
        href: "#product-tour",
      },
      trustedBy: "Trusted by distributors modernizing operations worldwide",
      trustLogos: [
        {
          name: "Amazon",
          image: "/marketing/nextly/brands/amazon.svg",
          alt: "Amazon logo",
        },
        {
          name: "Verizon",
          image: "/marketing/nextly/brands/verizon.svg",
          alt: "Verizon logo",
        },
        {
          name: "Microsoft",
          image: "/marketing/nextly/brands/microsoft.svg",
          alt: "Microsoft logo",
        },
        {
          name: "Netflix",
          image: "/marketing/nextly/brands/netflix.svg",
          alt: "Netflix logo",
        },
        {
          name: "Sony",
          image: "/marketing/nextly/brands/sony.svg",
          alt: "Sony logo",
        },
      ],
      heroImage: {
        src: "/marketing/nextly/hero.png",
        alt: "Screenshot of IslandiaAI analytics dashboard",
      },
    },
    benefits: [
      {
        title: "Automate the boring parts of revenue operations",
        description:
          "Let IslandiaAI reconcile orders, invoices, and product requests so your operators can focus on customer outcomes.",
        image: {
          src: "/marketing/nextly/benefit-one.png",
          alt: "Operator managing orders with IslandiaAI",
        },
        bullets: [
          {
            title: "Understand demand signals",
            description:
              "Surface real-time insights across suppliers and customers with unified reporting.",
            icon: "insights",
          },
          {
            title: "Accelerate acquisition",
            description:
              "Automate onboarding tasks so new customers are production-ready in hours, not weeks.",
            icon: "acquisition",
          },
          {
            title: "Keep revenue on track",
            description:
              "Resolve exceptions with AI-suggested actions before they impact cash flow.",
            icon: "retention",
          },
        ],
      },
      {
        title: "Designed for modern, distributed teams",
        description:
          "IslandiaAI brings collaboration, observability, and secure automation to your entire go-to-market team.",
        image: {
          src: "/marketing/nextly/benefit-two.png",
          alt: "Team collaborating using IslandiaAI workspace",
        },
        bullets: [
          {
            title: "Mobile-ready experiences",
            description:
              "Give field teams the same visibility as HQ with responsive dashboards.",
            icon: "mobile",
          },
          {
            title: "Service orchestration",
            description:
              "Connect GraphQL APIs and legacy systems with reusable automation playbooks.",
            icon: "automation",
          },
          {
            title: "Dark & light modes",
            description:
              "Work comfortably day or night with adaptive themes that respect preferences.",
            icon: "darkmode",
          },
        ],
      },
    ],
    video: {
      title: "Tour the IslandiaAI control center",
      description:
        "See how AI-assisted workflows help teams reconcile invoices, approve product requests, and eliminate manual entry.",
      videoId: "fZ0D0cnR88E",
    },
    testimonials: [
      {
        quote:
          "IslandiaAI keeps every supplier conversation connected to orders and invoices, so nothing slips through the cracks.",
        highlight: "connected to orders and invoices",
        name: "Sarah Steiner",
        role: "VP of Revenue Operations, Northwind",
        avatar: {
          src: "/marketing/nextly/user1.jpg",
          alt: "Portrait of Sarah Steiner",
        },
      },
      {
        quote:
          "We replaced six spreadsheets and finally have proactive alerts when invoices drift from expectations.",
        highlight: "proactive alerts",
        name: "Dylan Ambrose",
        role: "Head of Finance, Horizon Retail",
        avatar: {
          src: "/marketing/nextly/user2.jpg",
          alt: "Portrait of Dylan Ambrose",
        },
      },
      {
        quote:
          "It feels like the platform was built for us—the AI suggestions make onboarding new suppliers effortless.",
        highlight: "AI suggestions",
        name: "Gabrielle Winn",
        role: "COO, Polar Supply",
        avatar: {
          src: "/marketing/nextly/user3.jpg",
          alt: "Portrait of Gabrielle Winn",
        },
      },
    ],
    faq: [
      {
        question: "Is IslandiaAI available for free trials?",
        answer:
          "Yes. You can explore the product with a guided sandbox before inviting your full team.",
      },
      {
        question: "How does IslandiaAI connect to our backend systems?",
        answer:
          "Our GraphQL gateway securely orchestrates data from your existing Rails services and third-party tools.",
      },
      {
        question: "Do you offer onboarding support?",
        answer:
          "Absolutely. Every plan includes a dedicated specialist to configure workflows and train your operators.",
      },
      {
        question: "What languages are supported?",
        answer:
          "The app ships with English and Spanish experiences, and we’re expanding coverage based on customer demand.",
      },
    ],
    cta: {
      title: "Ready to align your revenue operations?",
      description:
        "Connect IslandiaAI to your supplier and customer data to unlock AI-assisted workflows in minutes.",
      primaryAction: {
        label: "Book a Strategy Call",
        href: "/contact",
      },
      secondaryAction: {
        label: "Read Documentation",
        href: "/docs",
      },
    },
    footer: {
      copyright: "© " + new Date().getFullYear() + " IslandiaAI. All rights reserved.",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Support", href: "/support" },
      ],
    },
  },
  es: {
    meta: {
      title: "IslandiaAI | Flujos financieros inteligentes para distribuidores",
      description:
        "Optimiza las operaciones con proveedores y clientes con flujos asistidos por IA en pedidos, facturas y conciliación.",
    },
    nav: {
      logo: {
        src: "/marketing/nextly/logo.svg",
        alt: "Logotipo de IslandiaAI",
      },
      links: [
        { label: "Funciones", href: "#features" },
        { label: "Automatización", href: "#automation" },
        { label: "Casos de Éxito", href: "#testimonials" },
        { label: "Preguntas", href: "#faq" },
      ],
      cta: {
        label: "Ir al Panel",
        href: "/signin",
      },
    },
    hero: {
      eyebrow: "IslandiaAI para equipos de ingresos",
      title: "Todo el ciclo de pedidos, finalmente sincronizado.",
      description:
        "Unifica proveedores, solicitudes de productos y facturas en un espacio asistido por IA que habla el idioma de tu equipo.",
      primaryAction: {
        label: "Iniciar prueba gratis",
        href: "/signup",
      },
      secondaryAction: {
        label: "Ver recorrido del producto",
        href: "#product-tour",
      },
      trustedBy: "Confían en nosotros distribuidores que modernizan sus operaciones",
      trustLogos: [
        {
          name: "Amazon",
          image: "/marketing/nextly/brands/amazon.svg",
          alt: "Logotipo de Amazon",
        },
        {
          name: "Verizon",
          image: "/marketing/nextly/brands/verizon.svg",
          alt: "Logotipo de Verizon",
        },
        {
          name: "Microsoft",
          image: "/marketing/nextly/brands/microsoft.svg",
          alt: "Logotipo de Microsoft",
        },
        {
          name: "Netflix",
          image: "/marketing/nextly/brands/netflix.svg",
          alt: "Logotipo de Netflix",
        },
        {
          name: "Sony",
          image: "/marketing/nextly/brands/sony.svg",
          alt: "Logotipo de Sony",
        },
      ],
      heroImage: {
        src: "/marketing/nextly/hero.png",
        alt: "Captura del panel de análisis de IslandiaAI",
      },
    },
    benefits: [
      {
        title: "Automatiza las tareas repetitivas de operaciones",
        description:
          "IslandiaAI concilia pedidos, facturas y solicitudes de productos para que tu equipo se enfoque en los clientes.",
        image: {
          src: "/marketing/nextly/benefit-one.png",
          alt: "Operador gestionando pedidos con IslandiaAI",
        },
        bullets: [
          {
            title: "Comprende las señales de demanda",
            description:
              "Obtén información en tiempo real de proveedores y clientes con reportes unificados.",
            icon: "insights",
          },
          {
            title: "Acelera la adquisición",
            description:
              "Automatiza el onboarding para que nuevos clientes estén listos en horas, no semanas.",
            icon: "acquisition",
          },
          {
            title: "Mantén tus ingresos en curso",
            description:
              "Resuelve excepciones con acciones sugeridas por IA antes de que afecten el flujo de caja.",
            icon: "retention",
          },
        ],
      },
      {
        title: "Diseñado para equipos modernos y distribuidos",
        description:
          "IslandiaAI combina colaboración, observabilidad y automatización segura para todo tu equipo comercial.",
        image: {
          src: "/marketing/nextly/benefit-two.png",
          alt: "Equipo colaborando con la plataforma IslandiaAI",
        },
        bullets: [
          {
            title: "Experiencias listas para móviles",
            description:
              "Ofrece a los equipos de campo la misma visibilidad que la oficina con tableros responsivos.",
            icon: "mobile",
          },
          {
            title: "Orquestación de servicios",
            description:
              "Conecta APIs GraphQL y sistemas legados con playbooks de automatización reutilizables.",
            icon: "automation",
          },
          {
            title: "Modos claro y oscuro",
            description:
              "Trabaja cómodo de día o de noche con temas adaptativos que respetan las preferencias.",
            icon: "darkmode",
          },
        ],
      },
    ],
    video: {
      title: "Recorre el centro de control de IslandiaAI",
      description:
        "Descubre cómo los flujos asistidos por IA ayudan a conciliar facturas, aprobar solicitudes y evitar la captura manual.",
      videoId: "fZ0D0cnR88E",
    },
    testimonials: [
      {
        quote:
          "IslandiaAI mantiene cada conversación con proveedores vinculada a pedidos y facturas, así nada se pierde.",
        highlight: "vinculada a pedidos y facturas",
        name: "Sarah Steiner",
        role: "VP de Operaciones de Ingresos, Northwind",
        avatar: {
          src: "/marketing/nextly/user1.jpg",
          alt: "Retrato de Sarah Steiner",
        },
      },
      {
        quote:
          "Reemplazamos seis hojas de cálculo y ahora tenemos alertas proactivas cuando las facturas se desvían.",
        highlight: "alertas proactivas",
        name: "Dylan Ambrose",
        role: "Director Financiero, Horizon Retail",
        avatar: {
          src: "/marketing/nextly/user2.jpg",
          alt: "Retrato de Dylan Ambrose",
        },
      },
      {
        quote:
          "Se siente como si la plataforma estuviera hecha para nosotros; las sugerencias de IA facilitan el alta de proveedores.",
        highlight: "sugerencias de IA",
        name: "Gabrielle Winn",
        role: "COO, Polar Supply",
        avatar: {
          src: "/marketing/nextly/user3.jpg",
          alt: "Retrato de Gabrielle Winn",
        },
      },
    ],
    faq: [
      {
        question: "¿IslandiaAI ofrece pruebas gratuitas?",
        answer:
          "Sí. Puedes explorar el producto con un entorno guiado antes de invitar a tu equipo completo.",
      },
      {
        question: "¿Cómo se conecta IslandiaAI con nuestros sistemas?",
        answer:
          "Nuestro gateway GraphQL orquesta datos de tus servicios Rails existentes y herramientas de terceros de forma segura.",
      },
      {
        question: "¿Incluyen soporte de implementación?",
        answer:
          "Por supuesto. Cada plan incluye un especialista dedicado para configurar flujos y capacitar a tu equipo.",
      },
      {
        question: "¿Qué idiomas están disponibles?",
        answer:
          "La aplicación ofrece experiencias en inglés y español, y ampliamos la cobertura según la demanda.",
      },
    ],
    cta: {
      title: "¿Listo para alinear tus operaciones de ingresos?",
      description:
        "Conecta IslandiaAI a tus datos de proveedores y clientes para activar flujos asistidos por IA en minutos.",
      primaryAction: {
        label: "Agenda una reunión",
        href: "/contact",
      },
      secondaryAction: {
        label: "Ver documentación",
        href: "/docs",
      },
    },
    footer: {
      copyright:
        "© " + new Date().getFullYear() + " IslandiaAI. Todos los derechos reservados.",
      links: [
        { label: "Privacidad", href: "/privacy" },
        { label: "Términos", href: "/terms" },
        { label: "Soporte", href: "/support" },
      ],
    },
  },
};

export function getLandingContent(inputLocale?: string | null): LandingPageContent {
  const locale = normalizeLocale(inputLocale ?? DEFAULT_LOCALE);

  return CONTENT_BY_LOCALE[locale];
}
