/**
 * Configuration principale du Cabinet d'Ophtalmologie & Chirurgie Oculaire à Lomé (Togo).
 * Toutes les coordonnées, horaires, services, durées et textes sont facilement modifiables ici.
 */

export interface ServiceItem {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  defaultDurationMinutes: number;
  price: string;
  imageUrl: string;
  iconName: 'Eye' | 'Activity' | 'Sparkles' | 'ShieldAlert' | 'FileText' | 'ScanEye' | 'Glasses';
  badge?: string;
  isUrgent?: boolean;
}

export interface ClinicConfig {
  name: string;
  shortName: string;
  tagline: string;
  doctorName: string;
  doctorTitle: string;
  doctorBio: string;
  phone: string;
  phoneDisplay: string;
  whatsappNumber: string;
  whatsappMessageDefault: string;
  address: {
    district: string;
    landmark: string;
    city: string;
    country: string;
    full: string;
    googleMapsUrl: string;
    googleMapsEmbedQuery: string;
  };
  operatingHours: {
    weekday: string;
    saturday: string;
    sunday: string;
    details: {
      days: number[]; // 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat, 0: Sun
      start: string;
      end: string;
      label: string;
    }[];
  };
  metrics: {
    label: string;
    value: number;
    suffix: string;
    description: string;
  }[];
  services: ServiceItem[];
  preparationInstructions: {
    id: string;
    title: string;
    text: string;
    icon: string;
    important?: boolean;
  }[];
  emergencySymptoms: {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'urgent';
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

export const clinicConfig: ClinicConfig = {
  name: "Cabinet d'Ophtalmologie & Chirurgie Oculaire",
  shortName: "Ophtalmo Lomé",
  tagline: "Excellence chirurgicale et soins de pointe pour votre vision à Lomé",
  doctorName: "Dr. Edma",
  doctorTitle: "Chirurgien Ophtalmologiste",
  doctorBio: "Chirurgien ophtalmologiste spécialisé en micro-chirurgie oculaire de la cataracte et des paupières, glaucome et pathologies rétiniennes à Lomé (Togo).",
  phone: "+228 93 75 40 50",
  phoneDisplay: "+228 93 75 40 50",
  whatsappNumber: "22893754050",
  whatsappMessageDefault: "Bonjour Docteur, je souhaite prendre contact pour une consultation à votre cabinet.",
  
  address: {
    district: "Quartier Dakar",
    landmark: "Près de l'hôtel La Négresse",
    city: "Lomé",
    country: "Togo",
    full: "Quartier Dakar, près de l'hôtel La Négresse, Lomé, Togo",
    googleMapsUrl: "https://maps.google.com/?q=Lomé+Togo+Quartier+Dakar+La+Negresse",
    googleMapsEmbedQuery: "Quartier Dakar Lomé Togo La Négresse",
  },

  operatingHours: {
    weekday: "Lundi – Vendredi : 7h30 – 16h00",
    saturday: "Samedi : 8h00 – 12h00",
    sunday: "Dimanche : Fermé (Urgences sur appel)",
    details: [
      { days: [1, 2, 3, 4, 5], start: "07:30", end: "16:00", label: "Lundi à Vendredi (07h30 - 16h00)" },
      { days: [6], start: "08:00", end: "12:00", label: "Samedi matin (08h00 - 12h00)" },
    ],
  },

  metrics: [
    { label: "Années d'expertise", value: 15, suffix: "+", description: "En ophtalmologie médico-chirurgicale" },
    { label: "Interventions réussies", value: 4800, suffix: "+", description: "Cataractes et micro-chirurgies" },
    { label: "Consultations", value: 25000, suffix: "+", description: "Patients soignés avec bienveillance" },
    { label: "Satisfaction", value: 99, suffix: "%", description: "Recommandé par nos patients" },
  ],

  services: [
    {
      id: "consultation",
      name: "Consultations ophtalmologiques",
      imageUrl: "https://i.imgur.com/0AkRNn3.png",
      price: "20 000 FCFA",
      defaultDurationMinutes: 30,
      shortDescription: "Bilan visuel complet, réfraction, acuité visuelle, biomicroscopie et mesure de la tension oculaire.",
      fullDescription: "Examen approfondi de la vue et des structures externes et internes de l'œil. Dépistage de la myopie, astigmatisme, presbytie et des anomalies oculaires précoces avec un plateau technique de haute précision.",
      iconName: "Eye",
      badge: "Bilan complet",
    },
    {
      id: "chirurgie_oculaire",
      name: "Chirurgie oculaire cataracte et paupières",
      imageUrl: "https://i.imgur.com/XSZ3Nd7.png",
      price: "Sur devis personnalisé",
      defaultDurationMinutes: 45,
      shortDescription: "Micro-chirurgie ambulatoire moderne et indolore pour le cristallin et la chirurgie palpébrale.",
      fullDescription: "Interventions micro-chirurgicales de pointe : chirurgie de la cataracte par phacoémulsification et chirurgie des paupières (ptôsis, entropion, ectropion, chalazion). Sortie le jour même en ambulatoire.",
      iconName: "Sparkles",
      badge: "Haute Précision",
    },
    {
      id: "cataracte",
      name: "Cataracte",
      imageUrl: "https://i.imgur.com/aXapNBR.jpeg",
      price: "Bilan dès 25 000 FCFA",
      defaultDurationMinutes: 45,
      shortDescription: "Diagnostic de l'opacification du cristallin, calcul d'implant et restauration d'une vision nette.",
      fullDescription: "Bilan pré-opératoire complet de la cataracte, biométrie oculaire avancée et sélection d'implants intraoculaires pliables de dernière génération pour retrouver confort et clarté visuelle.",
      iconName: "Eye",
      badge: "Spécialité",
    },
    {
      id: "glaucome",
      name: "Glaucome",
      imageUrl: "https://i.imgur.com/OMeyoQc.jpeg",
      price: "25 000 FCFA",
      defaultDurationMinutes: 30,
      shortDescription: "Pachymétrie, tonométrie à aplanation, analyse papillaire et surveillance de la pression oculaire.",
      fullDescription: "Le glaucome détruit silencieusement les fibres du nerf optique. Un dépistage régulier et un protocole thérapeutique rigoureux (gouttes, laser ou chirurgie) permettent de stopper son évolution.",
      iconName: "Activity",
      badge: "Dépistage vital",
    },
    {
      id: "diabete_retine",
      name: "Diabète (fond d’œil)",
      imageUrl: "https://i.imgur.com/QBID8TZ.jpeg",
      price: "25 000 FCFA",
      defaultDurationMinutes: 30,
      shortDescription: "Examen de la rétinopathie diabétique après dilatation pour prévenir l'œdème et les hémorragies.",
      fullDescription: "Examen indispensable au moins une fois par an pour toute personne diabétique. Permet d'observer directement la vascularisation rétinienne et de prévenir les complications graves de la vue.",
      iconName: "ScanEye",
      badge: "Suivi ciblé",
    },
    {
      id: "urgence",
      name: "Urgences oculaires",
      imageUrl: "https://i.imgur.com/hKYR0KW.jpeg",
      price: "Prise en charge immédiate 7j/7",
      defaultDurationMinutes: 15,
      shortDescription: "Œil rouge très douloureux, baisse brutale de vision, traumatisme oculaire ou corps étranger.",
      fullDescription: "Priorité médicale absolue sans attente. Contact direct pour une orientation et une prise en charge urgente en cabinet ou au bloc opératoire afin de sauvegarder votre vision.",
      iconName: "ShieldAlert",
      badge: "Urgence 7j/7",
      isUrgent: true,
    },
  ],

  preparationInstructions: [
    {
      id: "docs",
      title: "Ordonnances & Examens antérieurs",
      text: "Apportez votre carnet de santé, vos anciennes ordonnances de collyres et vos derniers examens ophtalmologiques (champ visuel, OCT, bilans sanguins).",
      icon: "FileCheck",
      important: true,
    },
    {
      id: "glasses",
      title: "Vos lunettes actuelles",
      text: "Venez avec vos lunettes de vue et de soleil habituelles. Si vous portez des lentilles de contact, retirez-les idéalement 24h avant la consultation.",
      icon: "Glasses",
    },
    {
      id: "accompanied",
      title: "Être accompagné(e)",
      text: "Pour un fond d'œil (dilatation pupillaire) ou une chirurgie oculaire, votre vision sera floue pendant 2 à 4 heures. La conduite automobile ou en moto est proscrite.",
      icon: "UserCheck",
      important: true,
    },
    {
      id: "fasting",
      title: "Consignes de jeûne (chirurgie)",
      text: "Le jeûne n'est nécessaire que si le chirurgien vous l'a expressément prescrit lors de la consultation pré-opératoire.",
      icon: "Clock",
    },
    {
      id: "makeup",
      title: "Pas de maquillage des yeux",
      text: "Le jour de votre consultation ou opération, veillez à ne porter aucun maquillage, mascara ou crème sur le pourtour des yeux.",
      icon: "Sparkles",
    },
  ],

  emergencySymptoms: [
    {
      id: "pain_red",
      title: "Œil rouge très douloureux",
      description: "Douleur oculaire intense accompagnée de rougeur, nausées ou maux de tête.",
      severity: "critical",
    },
    {
      id: "vision_loss",
      title: "Baisse brutale de la vision",
      description: "Perte soudaine totale ou partielle de la vue d'un œil, sans douleur apparente.",
      severity: "critical",
    },
    {
      id: "foreign_body",
      title: "Corps étranger ou projection chimique",
      description: "Éclat de métal, produit caustique, sable ou traumatisme perforant ou contondant.",
      severity: "critical",
    },
    {
      id: "flash_curtain",
      title: "Éclairs lumineux ou voile noir",
      description: "Impression de rideau noir tombant sur le champ visuel ou pluies de suie (suspicion de décollement de rétine).",
      severity: "urgent",
    },
  ],

  faqs: [
    {
      question: "Quels sont les jours et heures d'ouverture du cabinet ?",
      answer: "Nous vous accueillons du Lundi au Vendredi de 7h30 à 16h00 sans interruption, et le Samedi de 8h00 à 12h00. Le dimanche est réservé aux urgences aiguës sur appel téléphonique ou WhatsApp.",
    },
    {
      question: "Comment se déroule la réservation d'un rendez-vous ?",
      answer: "Choisissez votre type de consultation, sélectionnez une date et un créneau disponible parmi ceux proposés en temps réel, renseignez vos coordonnées, puis validez : la demande est réservée et vous êtes automatiquement redirigé(e) vers notre WhatsApp avec le message pré-rempli pour la confirmation.",
    },
    {
      question: "Faut-il être accompagné(e) pour une opération de la cataracte ?",
      answer: "Oui, impérativement. Bien que l'intervention se déroule sous anesthésie locale et en ambulatoire (vous rentrez chez vous le jour même), un pansement ou une coque protège l'œil opéré et la conduite de véhicule ou moto est formellement interdite.",
    },
    {
      question: "L'intervention de la cataracte est-elle douloureuse ?",
      answer: "Non. L'intervention est totalement indolore grâce à l'instillation de gouttes anesthésiantes puissantes. Une légère sensation de pression peut être ressentie pendant quelques minutes, mais aucune douleur vive.",
    },
    {
      question: "Combien de temps dure l'effet des gouttes pour le fond d'œil ?",
      answer: "Les gouttes mydriatiques dilatent la pupille pour permettre d'examiner la rétine en détail. L'effet de flou visuel et d'éblouissement dure en moyenne 2 à 4 heures. Prévoyez des lunettes de soleil pour votre sortie.",
    },
    {
      question: "Quels sont les modes de règlement acceptés ?",
      answer: "Le cabinet accepte les espèces (FCFA), ainsi que les paiements mobiles usuels au Togo (T-Money, Moov Money) pour votre confort et votre sécurité.",
    },
  ],
};
