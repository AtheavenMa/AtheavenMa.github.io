const socials = [
  { label: "Email", tip: "Email", href: "mailto:hma232@wisc.edu", icon: "email" },
  { label: "Google Scholar", tip: "Scholar", href: "https://scholar.google.com/citations?user=UMm3StwAAAAJ", icon: "scholar" },
  { label: "GitHub", tip: "GitHub", href: "https://github.com/HunterMa97", icon: "github" },
  { label: "LinkedIn", tip: "LinkedIn", href: "https://www.linkedin.com/in/haotian-ma-591a47422/", icon: "linkedin" },
];

const news = [
  { date: "Sep 24, 2026", html: "<strong>Spectral-Spatial Interpretation</strong> is accepted by NeurIPS 2026!" },
  {
    date: "Jul 22, 2026",
    html: '<a href="https://www.waisman.wisc.edu/2026/07/22/new-ai-tool-enhances-cell-segmentation-with-gene-expression-data/" target="_blank" rel="noopener">Waisman Center featured SegJointGene</a>, a new AI tool for cell segmentation with gene expression data.',
  },
  { date: "Jul 12, 2026", html: "Presented <strong>Spatial Phenotyping</strong> at ISMB." },
  { date: "Oct 17, 2025", html: "Presented <strong>SegJointGene</strong> at ACM BCB." },
];

const publications = [
  {
    year: 2026,
    badge: "iclr",
    venueBadge: "ICLR Submission",
    tags: ["selected"],
    title: "Sparse Autoencoders Do Not Guarantee Local Features",
    authors: "Haotian Ma, Ruqi Yang",
    venueFull: "ICLR 2027 Submission",
  },
  {
    year: 2026,
    badge: "iclr",
    venueBadge: "ICLR Submission",
    tags: ["selected"],
    title: "Certifying Reuse for LLM Components from Local Interventions",
    authors: "Haotian Ma",
    venueFull: "ICLR 2027 Submission",
  },
  {
    year: 2026,
    badge: "iclr",
    venueBadge: "ICLR Submission",
    tags: ["selected"],
    title: "Behavioral Compositionality of Sparse Autoencoder Representations",
    authors: "Haotian Ma, Ziye Mei, Frederic Sala",
    venueFull: "ICLR 2027 Submission",
  },
  {
    year: 2026,
    badge: "iclr",
    venueBadge: "ICLR Submission",
    tags: ["selected"],
    title: "The Horizon of Reward Guidance",
    authors: "Haotian Ma",
    venueFull: "ICLR 2027 Submission",
  },
  {
    year: 2026,
    badge: "aaai",
    venueBadge: "AAAI Submission",
    tags: ["selected"],
    title: "Representation Redistribution in Sparse Autoencoders",
    authors: "Ziye Mei, Haotian Ma",
    venueFull: "AAAI Submission",
  },
  {
    year: 2026,
    badge: "neurips",
    venueBadge: "NeurIPS",
    tags: ["published", "selected"],
    title: "Spectral-Spatial Interpretation",
    authors: "Haotian Ma, Ruqi Yang, Philip Townsend",
    venueFull: "Advances in Neural Information Processing Systems",
  },
  {
    year: 2026,
    badge: "ismb",
    venueBadge: "ISMB Poster",
    tags: ["poster", "selected"],
    title: "Spatial phenotyping linking single cell genomics to disease pathology through joint deep representation learning",
    authors: "Chenfeng He, Haotian Ma, Pubudu Kumarage, Xuerou Li, Kalpana Hanthanan Arachchilage, Shuang Liu, Daifeng Wang",
    venueFull: "ISMB Poster",
  },
  {
    year: 2026,
    badge: "bioinformatics",
    venueBadge: "Bioinformatics",
    tags: ["published", "selected"],
    title: "SegJointGene: Joint Cell Segmentation and Spatial Gene Prioritization by Information Entropy Guided Convolutional Neural Networks",
    authors: "Haotian Ma, Daifeng Wang",
    venueFull: "Bioinformatics",
  },
  {
    year: 2022,
    badge: "neurips",
    venueBadge: "NeurIPS",
    tags: ["published"],
    title: "AutoWS-Bench-101: Benchmarking Automated Weak Supervision with 100 Labels",
    authors: "Nicholas Roberts, Xintong Li, Tzu-Heng Huang, Dyah Adila, Spencer Schoenberg, Cheng-Yu Liu, Lauren Pick, Haotian Ma, Aws Albarghouthi, Frederic Sala",
    venueFull: "Advances in Neural Information Processing Systems",
  },
  {
    year: 2022,
    badge: "icml",
    venueBadge: "ICML",
    tags: ["published", "selected"],
    title: "Quantification and Analysis of Layer-wise and Pixel-wise Information Discarding",
    authors: "Haotian Ma, Hao Zhang, Fan Zhou, Yinqing Zhang, Quanshi Zhang",
    venueFull: "International Conference on Machine Learning",
  },
  {
    year: 2020,
    badge: "iclr",
    venueBadge: "ICLR",
    tags: ["published", "selected"],
    title: "Interpretable Complex-Valued Neural Networks for Privacy Protection",
    authors: "Liyao Xiang, Hao Zhang, Haotian Ma, Yifan Zhang, Jie Ren, Quanshi Zhang",
    venueFull: "International Conference on Learning Representations",
  },
  {
    year: 2019,
    badge: "cvpr",
    venueBadge: "CVPR",
    tags: ["published", "selected"],
    title: "Interpreting CNNs via Decision Trees",
    authors: "Quanshi Zhang, Yu Yang, Haotian Ma, Ying Nian Wu",
    venueFull: "Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition",
  },
  {
    year: 2019,
    badge: "preprint",
    venueBadge: "Preprint",
    tags: ["preprint"],
    title: "Explaining AlphaGo: Interpreting Contextual Effects in Neural Networks",
    authors: "Zenan Ling*, Haotian Ma*, Yu Yang, Robert C. Qiu, Song-Chun Zhu, Quanshi Zhang",
    venueFull: "arXiv",
  },
];

const researchExperience = [
  {
    title: "Faithful Representations and Mechanistic Interpretability",
    lines: [
      {
        text: "Develop theoretical and empirical methods for determining whether learned features correspond to stable and functionally meaningful structure in neural systems.",
        em: true,
      },
    ],
    items: [
      {
        title: "Sparse Autoencoders Do Not Guarantee Local Features",
        aside: "ICLR 2027 Submission",
        lines: [{ text: "Haotian Ma, Ruqi Yang", em: true }],
        points: [
          "Showed that sparse learned features can reconstruct activations well without corresponding to localized model behavior, revealing a gap between reconstruction quality and functional interpretability.",
        ],
      },
      {
        title: "Representation Redistribution in Sparse Autoencoders",
        aside: "AAAI 2027 Submission",
        lines: [{ text: "Ziye Mei, Haotian Ma", em: true }],
        points: [
          "Introduced a metric for identifying reproducible shifts in sparse feature activity across related prompts and assessing their consequences for downstream model behavior.",
        ],
      },
      {
        title: "Quantification and Analysis of Layer-wise and Pixel-wise Information Discarding",
        aside: "ICML 2022 Spotlight",
        lines: [{ text: "Haotian Ma, Hao Zhang, Fan Zhou, Yinqing Zhang, Quanshi Zhang", em: true }],
        points: [
          "Connected information entropy theory to interpretable diagnostics of how neural representations preserve and remove information across spatial locations and network depth.",
        ],
      },
    ],
  },
  {
    title: "Interpretable AI for Scientific Discovery",
    lines: [
      {
        text: "Develop interpretable methods that preserve domain structure and reveal scientifically meaningful organization in high dimensional biological and spatial data.",
        em: true,
      },
    ],
    items: [
      {
        title: "Spectral-Spatial Interpretation",
        aside: "NeurIPS 2026",
        lines: [{ text: "Haotian Ma, Ruqi Yang, Philip Townsend", em: true }],
        points: [
          "Developed a hierarchical attribution framework that respects spatial and spectral structure while providing principled feature level explanations under structured interventions.",
        ],
      },
      {
        title: "SegJointGene: joint cell segmentation and spatial gene prioritization by information entropy guided CNNs",
        aside: "Bioinformatics 2026",
        lines: [{ text: "Haotian Ma, Daifeng Wang", em: true }],
        points: [
          "Unified cell segmentation with entropy guided molecular prioritization so that cellular boundaries and spatial molecular evidence can be learned within a common framework.",
        ],
      },
      {
        title: "Spatial Phenotyping Linking Single Cell Genomics to Disease Pathology through Joint Deep Learning",
        aside: "ISMB 2026",
        lines: [
          {
            text: "Chenfeng He, Haotian Ma, Pubudu Kumarage, Xuerou Li, Kalpana Hanthanan Arachchilage, Shuang Liu, Daifeng Wang",
            em: true,
          },
        ],
        points: [
          "Learned joint representations connecting tissue morphology with single cell molecular information to identify disease associated spatial phenotypes.",
        ],
      },
    ],
  },
  {
    title: "Compositionality, Intervention, and Reasoning for LLMs",
    lines: [
      {
        text: "Study when local evidence and interventions can support reliable conclusions about the behavior of larger learned systems.",
        em: true,
      },
    ],
    items: [
      {
        title: "Certifying Reuse for LLM Components from Local Interventions",
        aside: "ICLR 2027 Submission",
        lines: [{ text: "Haotian Ma", em: true }],
        points: [
          "Established a certification framework for deciding when evidence from local interventions is sufficient to reuse LLM components in unseen combinations.",
        ],
      },
      {
        title: "Behavioral Compositionality of Sparse Autoencoder Representations",
        aside: "ICLR 2027 Submission",
        lines: [{ text: "Haotian Ma, Ziye Mei, Frederic Sala", em: true }],
        points: [
          "Introduced a metric that quantifies the compositionality of downstream behavior by measuring departures from additive component effects.",
        ],
      },
      {
        title: "The Horizon of Reward Guidance",
        aside: "ICLR 2027 Submission",
        lines: [{ text: "Haotian Ma", em: true }],
        points: [
          "Characterized the exact horizon over which finite speed reward adaptation can continue to guide a changing policy.",
        ],
      },
    ],
  },
];

const education = [
  {
    title: "University of Wisconsin–Madison",
    aside: "Sep 2021 – June 2027",
    lines: [{ text: "Madison, WI" }, { text: "Ph.D. in Computer Sciences" }],
    points: ["Advisor: Prof. Daifeng Wang"],
  },
  {
    title: "Southern University of Science and Technology",
    aside: "Sep 2016 – June 2021",
    lines: [{ text: "Shenzhen, China" }, { text: "B.S. in Physics" }],
    points: ["Advisor: Prof. Hu Xu"],
  },
];

const workExperience = [
  {
    title: "ALP Precollege, University of Wisconsin Madison",
    aside: "July 2025 – Aug 2025",
    lines: [{ text: "Madison, WI" }, { text: "Education Assistant", em: true }],
    points: ["Supervisor: Jamison Wendlandt"],
  },
  {
    title: "Center for Vision, Cognition, Learning, and Autonomy (VCLA), UCLA",
    aside: "July 2020 – Oct 2020",
    lines: [{ text: "Los Angeles, CA" }, { text: "Research Intern", em: true }],
    points: ["Advisor: Prof. Ying Nian Wu"],
  },
  {
    title: "John Hopcroft Center, Shanghai Jiao Tong University",
    aside: "July 2018 – July 2019",
    lines: [{ text: "Shanghai, China" }, { text: "Research Assistant", em: true }],
    points: ["Advisor: Prof. Quanshi Zhang"],
  },
];

const service = [
  {
    title: "Awards",
    html: `<ul class="award-list"><li><strong>Silver Reviewer</strong>, ICML, 2026</li><li><strong>Departmental Scholarship</strong>, UW–Madison Computer Sciences, 2026, 2024</li><li><strong>Student and Young Professional Award</strong>, ACM BCB, 2025</li><li><strong>First-Year Departmental Scholarship</strong>, UW–Madison Computer Sciences, 2021</li><li><strong>Second Prize</strong>, ASC Student Supercomputer Challenge, 2018</li><li><strong>Silver Medal</strong>, International Genetically Engineered Machine Competition, 2018</li><li><strong>Outstanding Camper</strong>, 6th of 120, Nankai University National Philosophy Summer Program for High School Students, 2015</li><li><strong>National Second Prize</strong>, 6th National Mathematics, Physics and Chemistry Competition for Secondary School Students, 2014</li></ul>`,
  },
  { title: "Journal Reviewer", muted: "IEEE Transactions on Neural Networks and Learning Systems (TNNLS), Pattern Recognition (Elsevier)" },
  { title: "Conference Reviewer", muted: "AAAI 2027, NeurIPS 2026, ICML 2026, CVPR 2026, etc." },
  {
    title: "Teaching",
    muted: "CS 320 (Fall 2021, Spring 2022, Fall 2022, Spring 2023)<br>CS 540 (Fall 2023)<br>CS/BMI 776 (Spring 2024, Spring 2025, Spring 2026)<br>CS 760 (Fall 2024, Fall 2025, Fall 2026)",
  },
];

const openTo = [
  {
    title: "Positions",
    muted: "I am actively looking for positions related to LLM safety and interpretability, and in particular, I'm interested in developing faithful measurement tools.",
  },
  {
    title: "Review invitations",
    muted: "I am happy to serve as a reviewer for AI conferences, journals, and workshops, and welcome such invitations.",
  },
  {
    title: "Collaborations",
    muted: "I am always excited to collaborate on research in mechanistic interpretability, game-theoretic methods, and broader topics in LLM safety. Please feel free to reach out!",
  },
];
