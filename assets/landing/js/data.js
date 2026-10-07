const socials = [
  { label: "Email", tip: "Email", href: "mailto:hma232@wisc.edu", icon: "email" },
  { label: "Google Scholar", tip: "Scholar", href: "https://scholar.google.com/citations?user=UMm3StwAAAAJ", icon: "scholar" },
  { label: "GitHub", tip: "GitHub", href: "https://github.com/HunterMa97", icon: "github" },
  { label: "LinkedIn", tip: "LinkedIn", href: "https://www.linkedin.com/in/Atheaven-Ma", icon: "linkedin" },
  { label: "CV", tip: "CV", href: "/CV.pdf?v=20261007-wc", icon: "cv" },
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

const skills = [
  { html: "<strong>LLMs &amp; Agent Systems:</strong> LLM Evaluation, LLM Inference, Prompt Engineering, Synthetic Data Generation, Multi-Agent Orchestration, Large-Scale Agent Experimentation, Evaluation Harnesses, vLLM" },
  { html: "<strong>Machine Learning &amp; Interpretability:</strong> Mechanistic Interpretability, Sparse Autoencoders, Representation Analysis, Representation Interventions, LLM Steering, Feature Attribution, Multimodal Learning, Transformers" },
  { html: "<strong>GPU, HPC &amp; Performance Engineering:</strong> CUDA/GPU, GPU Parallelism, Parallel Experiment Execution, Performance Optimization, Slurm/HPC, Linux, Bash, Docker" },
  { html: "<strong>Statistical &amp; Scientific Computing:</strong> Statistical Inference, Hierarchical Bayesian Modeling, Low-Rank Modeling, Image Segmentation, Spatial Omics, Spatial Transcriptomics, Spatial Proteomics" },
  { html: "<strong>Programming &amp; Tools:</strong> Python, C++, R, SQL, PyTorch, TensorFlow, scikit-learn, Git" },
];

const awards = [
  { html: "<strong>Silver Reviewer</strong>, ICML, 2026" },
  { html: "<strong>Student and Young Professional Award</strong>, ACM BCB, 2025" },
  { html: "<strong>UW–Madison Computer Sciences Scholarship</strong>, 2024" },
  { html: "<strong>UW–Madison Computer Sciences First-Year Scholarship</strong>, 2021" },
  { html: "<strong>Second Prize</strong>, ASC Student Supercomputer Challenge, 2018" },
  { html: "<strong>Silver Medal</strong>, International Genetically Engineered Machine (iGEM) Competition, 2018" },
  { html: "<strong>Outstanding Participant, Ranked 6th of 120</strong>, Nankai University National High School Philosophy Summer Program, 2015" },
  { html: "<strong>National Second Prize</strong>, 6th National Mathematics, Physics and Chemistry Competition for Secondary School Students, 2014" },
];

const publications = [
  {
    year: 2027,
    badge: "naacl",
    venueBadge: "NAACL Submission",
    tags: ["selected"],
    category: "reasoning",
    title: "SymSelect: Learning Which Transformations to Trust for Systematic Reasoning",
    authors: "Haotian Ma, Ruqi Yang",
    venueFull: "NAACL 2027 Submission",
  },
  {
    year: 2027,
    badge: "iclr",
    venueBadge: "ICLR Submission",
    tags: ["selected"],
    category: "mech",
    title: "Sparse Autoencoders Do Not Guarantee Local Features",
    authors: "Haotian Ma, Ruqi Yang",
    venueFull: "ICLR 2027 Submission",
  },
  {
    year: 2027,
    badge: "iclr",
    venueBadge: "ICLR Submission",
    tags: ["selected"],
    category: "reasoning",
    title: "Certifying Reuse for LLM Components from Local Interventions",
    authors: "Haotian Ma",
    venueFull: "ICLR 2027 Submission",
  },
  {
    year: 2027,
    badge: "iclr",
    venueBadge: "ICLR Submission",
    tags: ["selected"],
    category: "reasoning",
    title: "Behavioral Compositionality of Sparse Autoencoder Representations",
    authors: "Haotian Ma, Ziye Mei, Frederic Sala",
    venueFull: "ICLR 2027 Submission",
  },
  {
    year: 2027,
    badge: "iclr",
    venueBadge: "ICLR Submission",
    tags: ["selected"],
    category: "safety",
    title: "The Horizon of Reward Guidance",
    authors: "Haotian Ma",
    venueFull: "ICLR 2027 Submission",
  },
  {
    year: 2027,
    badge: "aaai",
    venueBadge: "AAAI Submission",
    tags: ["selected"],
    category: "mech",
    title: "Representation Redistribution in Sparse Autoencoders",
    authors: "Ziye Mei, Haotian Ma",
    venueFull: "AAAI 2027 Submission",
  },
  {
    year: 2027,
    badge: "aaai",
    venueBadge: "AAAI Submission",
    tags: ["selected"],
    category: "safety",
    title: "Gender Attribution by Proxy: Restraint, Fallback, and Rationalization in LLMs",
    authors: "Chenkun Jiang*, Haotian Ma*, Kai Chen, Haiyuan Liu",
    venueFull: "AAAI 2027 Submission",
  },
  {
    year: 2026,
    badge: "neurips",
    venueBadge: "NeurIPS",
    tags: ["published", "selected"],
    category: "discovery",
    title: "Spectral-Spatial Interpretation",
    authors: "Haotian Ma, Ruqi Yang, Philip Townsend",
    venueFull: "NeurIPS 2026",
  },
  {
    year: 2026,
    badge: "ismb",
    venueBadge: "ISMB Poster",
    tags: ["poster", "selected"],
    category: "discovery",
    title: "Spatial Phenotyping Linking Single Cell Genomics to Disease Pathology through Joint Deep Representation Learning",
    authors: "Chenfeng He*, Haotian Ma*, Pubudu Kumarage, Xuerou Li, Kalpana Hanthanan Arachchilage, Shuang Liu, Daifeng Wang",
    venueFull: "ISMB 2026 Poster",
  },
  {
    year: 2026,
    badge: "bioinformatics",
    venueBadge: "Bioinformatics",
    tags: ["published", "selected"],
    category: "discovery",
    title: "SegJointGene: Joint Cell Segmentation and Spatial Gene Prioritization by Information Entropy Guided CNNs",
    authors: "Haotian Ma, Daifeng Wang",
    venueFull: "Bioinformatics 2026",
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
    category: "mech",
    title: "Quantification and Analysis of Layer-wise and Pixel-wise Information Discarding",
    authors: "Haotian Ma, Hao Zhang, Fan Zhou, Yinqing Zhang, Quanshi Zhang",
    venueFull: "ICML 2022 Spotlight",
  },
  {
    year: 2020,
    badge: "iclr",
    venueBadge: "ICLR",
    tags: ["published", "selected"],
    category: "safety",
    title: "Interpretable Complex-Valued Neural Networks for Privacy Protection",
    authors: "Liyao Xiang, Hao Zhang, Haotian Ma, Yifan Zhang, Jie Ren, Quanshi Zhang",
    venueFull: "ICLR 2020",
  },
  {
    year: 2019,
    badge: "cvpr",
    venueBadge: "CVPR",
    tags: ["published", "selected"],
    category: "mech",
    title: "Interpreting CNNs via Decision Trees",
    authors: "Quanshi Zhang, Yu Yang, Haotian Ma, Ying Nian Wu",
    venueFull: "CVPR 2019",
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
        text: "Develop methods to determine what neural networks represent and whether those representations support faithful explanations and interventions.",
        em: true,
      },
    ],
    items: [
      {
        title: "Sparse Autoencoders Do Not Guarantee Local Features",
        aside: "ICLR 2027 Submission",
        lines: [{ text: "Haotian Ma, Ruqi Yang", em: true }],
        points: [
          "Demonstrated that accurate sparse autoencoder (SAE) reconstruction does not guarantee localized, interpretable features.",
          "Proved the same SAE can exhibit different input dependencies despite identical representation samples, and validated this across 5 trained SAEs.",
        ],
      },
      {
        title: "Representation Redistribution in Sparse Autoencoders",
        aside: "AAAI 2027 Submission",
        lines: [{ text: "Ziye Mei, Haotian Ma", em: true }],
        points: [
          "Found that prompt changes preserving the same request can redistribute sparse feature activity, with patterns persisting across unseen prompt variants.",
          "Validated across 27 SAEs spanning Gemma, Llama, Mistral, GPT, and Pythia, and assessed how they helped predict failures in frozen safety probes.",
        ],
      },
      {
        title: "Quantification and Analysis of Layer-wise and Pixel-wise Information Discarding",
        aside: "ICML 2022 Spotlight",
        lines: [{ text: "Haotian Ma, Hao Zhang, Fan Zhou, Yinqing Zhang, Quanshi Zhang", em: true }],
        points: [
          "Introduced information entropy measures that compare how neural networks discard input information across layers, models, and individual pixels.",
          "Derived a theoretical link between selective information discarding and the efficiency of extracting features relevant to the task.",
        ],
      },
      {
        title: "Interpreting CNNs via Decision Trees",
        aside: "CVPR 2019",
        lines: [{ text: "Quanshi Zhang, Yu Yang, Haotian Ma, Ying Nian Wu", em: true }],
        points: [
          "Converted hidden CNN features into object part concepts and quantified how those parts drive individual predictions.",
        ],
      },
    ],
  },
  {
    title: "Interpretable AI for Scientific Discovery",
    lines: [
      {
        text: "Develop interpretable AI methods that connect model decisions to scientifically meaningful spatial, spectral, and molecular structure.",
        em: true,
      },
    ],
    items: [
      {
        title: "Spectral-Spatial Interpretation",
        aside: "NeurIPS 2026",
        lines: [{ text: "Haotian Ma, Ruqi Yang, Philip Townsend", em: true }],
        points: [
          "Pioneered a framework that jointly identifies which spatial locations drive predictions and which spectral channels matter at each location.",
          "Outperformed Integrated Gradients, DeepSHAP, KernelSHAP, and RISE across 3 datasets in joint faithfulness, spatial localization, and spectral attribution.",
        ],
      },
      {
        title: "SegJointGene: Joint Cell Segmentation and Spatial Gene Prioritization by Information Entropy Guided CNNs",
        aside: "Bioinformatics 2026",
        lines: [{ text: "Haotian Ma, Daifeng Wang", em: true }],
        points: [
          "Developed an information entropy framework for cell segmentation and gene prioritization, improving molecular signal assignment accuracy by 5–20%.",
          "Identified neuronal development and synaptic signaling genes in brain tissue and lineage markers in human tonsil.",
        ],
      },
      {
        title: "Spatial Phenotyping Linking Single Cell Genomics to Disease Pathology through Joint Deep Representation Learning",
        aside: "ISMB 2026 Poster",
        lines: [
          {
            text: "Chenfeng He*, Haotian Ma*, Pubudu Kumarage, Xuerou Li, Kalpana Hanthanan Arachchilage, Shuang Liu, Daifeng Wang",
            em: true,
          },
        ],
        points: [
          "Learned joint representations of disease phenotype, gene expression, and spatial organization to identify cellular niches associated with disease.",
          "Integrated single cell RNA sequencing with spatial transcriptomics to transfer phenotype signals across cohorts and map disease pathology.",
        ],
      },
    ],
  },
  {
    title: "Compositionality, Intervention, and Systematic Reasoning in LLMs",
    lines: [
      {
        text: "Study when model components and structural transformations can be combined, reused, or generalized reliably in unseen settings.",
        em: true,
      },
    ],
    items: [
      {
        title: "Behavioral Compositionality of Sparse Autoencoder Representations",
        aside: "ICLR 2027 Submission",
        lines: [{ text: "Haotian Ma, Ziye Mei, Frederic Sala", em: true }],
        points: [
          "Characterized downstream interactions among SAE features, revealing combined effects differ from the sum of individual feature effects.",
          "Pairwise modeling improved combined steering prediction in Llama-3.1 8B by 33%.",
        ],
      },
      {
        title: "Certifying Reuse for LLM Components from Local Interventions",
        aside: "ICLR 2027 Submission",
        lines: [{ text: "Haotian Ma", em: true }],
        points: [
          "Formulated a framework to certify when locally tested LLM components can be reused in combinations never evaluated directly.",
          "Proved a few targeted tests can certify component reuse in untested combinations without evaluating every combination.",
        ],
      },
      {
        title: "SymSelect: Learning Which Transformations to Trust for Systematic Reasoning",
        aside: "NAACL 2027 Submission",
        lines: [{ text: "Haotian Ma, Ruqi Yang", em: true }],
        points: [
          "Established representation similarity as a signal for selecting useful transformations without validity labels.",
          "Recovered 77 to 92% of supervised alignment gains on MNS and I-RAVEN across ResNet, ViT, CLIP, and Context Choice Transformer.",
        ],
      },
    ],
  },
  {
    title: "Reliable LLMs and AI Safety",
    lines: [
      {
        text: "Study how AI systems remain reliable under uncertain preferences, underspecified user identities, and risks of private information leakage.",
        em: true,
      },
    ],
    items: [
      {
        title: "The Horizon of Reward Guidance",
        aside: "ICLR 2027 Submission",
        lines: [{ text: "Haotian Ma", em: true }],
        points: [
          "Defined the support horizon to measure how long existing preference feedback can continue guiding a changing policy.",
          "Proved this horizon can expire under ordinary policy gradient and showed targeted preference data can extend it.",
        ],
      },
      {
        title: "Gender Attribution by Proxy: Restraint, Fallback, and Rationalization in LLMs",
        aside: "AAAI 2027 Submission",
        lines: [{ text: "Chenkun Jiang*, Haotian Ma*, Kai Chen, Haiyuan Liu", em: true }],
        points: [
          "Introduced gender attribution by proxy, showing how LLMs turn ordinary user context into unsupported gender assumptions.",
          "Found that 6 LLMs systematically converted ordinary contextual cues into unsupported gender attributions when user gender was unspecified.",
        ],
      },
      {
        title: "Interpretable Complex-Valued Neural Networks for Privacy Protection",
        aside: "ICLR 2020",
        lines: [{ text: "Liyao Xiang, Hao Zhang, Haotian Ma, Yifan Zhang, Jie Ren, Quanshi Zhang", em: true }],
        points: [
          "Designed neural networks that encode intermediate features as complex values with randomized phases while preserving accurate predictions.",
          "Reduced attackers’ ability to reconstruct inputs or infer hidden properties across 8 neural networks.",
        ],
      },
    ],
  },
];

const education = [
  {
    title: "University of Wisconsin–Madison",
    aside: "Sep 2021 – Jun 2027",
    lines: [{ text: "Madison, WI" }, { text: "Ph.D. in Computer Sciences" }],
    points: ["Advisor: Prof. Daifeng Wang"],
  },
  {
    title: "Southern University of Science and Technology",
    aside: "Sep 2016 – Jun 2021",
    lines: [{ text: "Shenzhen, China" }, { text: "B.S. in Physics" }],
    points: ["Advisor: Prof. Hu Xu"],
  },
];

const workExperience = [
  {
    title: "Waisman Center, University of Wisconsin–Madison",
    aside: "Sep 2023 – Present",
    lines: [
      { text: "Madison, WI" },
      { text: "Graduate Research Assistant. Led methodological development and quantitative analysis for interpretable methods in spatial omics." },
    ],
    points: ["Advisor: Prof. Daifeng Wang"],
  },
  {
    title: "Department of Computer Sciences, University of Wisconsin–Madison",
    aside: "Sep 2021 – Jun 2022",
    lines: [
      { text: "Madison, WI" },
      { text: "Graduate Research Assistant. Developed symbolic labeling rules and evaluation pipelines for automated weak supervision." },
    ],
    points: ["Advisors: Prof. Aws Albarghouthi and Prof. Frederic Sala"],
  },
  {
    title: "Center for Vision, Cognition, Learning, and Autonomy (VCLA), UCLA",
    aside: "Jul 2020 – Oct 2020",
    lines: [
      { text: "Los Angeles, CA" },
      { text: "Research Intern. Explored energy-based modeling and efficient sampling methods for protein discovery." },
    ],
    points: ["Advisor: Prof. Ying Nian Wu"],
  },
  {
    title: "Department of Physics, Southern University of Science and Technology",
    aside: "Sep 2019 – Jun 2020",
    lines: [
      { text: "Shenzhen, China" },
      { text: "Research Assistant. Applied generative models and efficient sampling methods to identify stable crystal structures." },
    ],
    points: ["Advisor: Prof. Hu Xu"],
  },
  {
    title: "John Hopcroft Center, Shanghai Jiao Tong University",
    aside: "Jul 2018 – Jul 2019",
    lines: [
      { text: "Shanghai, China" },
      { text: "Research Intern. Investigated interpretable methods to explain the prediction logic of convolutional neural networks." },
    ],
    points: ["Advisor: Prof. Quanshi Zhang"],
  },
];

const service = [
  {
    title: "Journal Reviewer",
    muted: "Pattern Recognition (Elsevier) and IEEE Transactions on Neural Networks and Learning Systems (TNNLS)",
  },
  {
    title: "Conference Program Committee",
    muted: "NeurIPS 2026, ECCV 2026, ICML 2026, CVPR 2026, etc.",
  },
];

const teaching = [
  {
    title: "Teaching Assistant",
    muted: "UW–Madison: Machine Learning (CS 760)<br>UW–Madison: Introduction to Artificial Intelligence (CS 540)<br>UW–Madison: Data Science Programming II (CS 320)",
  },
  { title: "Education Assistant", muted: "UW–Madison ALP Precollege: Introduction to Neuroscience" },
];

const openTo = [
  {
    title: "Positions",
    muted: "I am actively seeking Research Scientist positions in mechanistic interpretability, AI safety, and frontier model evaluation!",
  },
  {
    title: "Review invitations",
    muted: "I am happy to serve as a reviewer for AI conferences, journals, and workshops, and welcome such invitations.",
  },
  {
    title: "Collaborations",
    muted: "I am always excited to collaborate on research in mechanistic interpretability, LLM reasoning, and broader topics in AI safety. Feel free to reach out!",
  },
];
