const questions = [
  // --- Set 1 ---
  { q: "Which type of analysis provides decision support and makes use of the prediction so that the analysis result can be used?", 
    a: ["Descriptive analysis", "Diagnostic analysis", "Predictive analysis", "Prescriptive analysis"], 
    c: "Prescriptive analysis" 
  },
  { q: "Which statistical method is used to determine if there exists a relationship between variables?", 
    a: ["A/B testing", "Correlation", "Regression", "Quantitative"], 
    c: "Correlation" 
  },
  { q: "Which of the following best describes the challenge of 'Variety' in Big Data?", 
    a: [
      "Managing the enormous amount of data being generated",
      "Handling different types and formats of data such as text, images, and databases",
      "Processing data quickly in real time or near real time",
      "Ensuring the data is accurate and trustworthy"
    ], 
    c: "Handling different types and formats of data such as text, images, and databases" 
  },

  // --- Set 2 ---
  { q: "What is a major security threat to big data during data ingress (entry)?", 
    a: ["Ransomware", "Data leakage", "Malicious data injection", "Data encryption"], 
    c: "Malicious data injection" 
  },
  { q: "What does the 'Velocity' characteristic of big data refer to?", 
    a: [
      "The speed at which data is generated and processed in real time.",
      "The volume of data collected over time.",
      "The diversity of data types and resources.",
      "The accuracy and reliability of data."
    ], 
    c: "The speed at which data is generated and processed in real time." 
  },
  { q: "How does big data differ from traditional data in terms of variety?", 
    a: [
      "Big data is only structured, while traditional data is unstructured.",
      "Traditional data is structured, while big data includes structured, semi-structured, and unstructured data.",
      "Both traditional data and big data are structured.",
      "Both traditional data and big data are unstructured."
    ], 
    c: "Traditional data is structured, while big data includes structured, semi-structured, and unstructured data." 
  },

  // --- Set 3 ---
  { q: "A financial institution needs to analyze credit card transactions in real time to block fraud. Which technologies are most appropriate?", 
    a: [
      "Apache Hadoop for data storage and Apache Spark for batch processing",
      "Apache Kafka to ingest transaction streams and Apache Flink for real-time processing",
      "Apache Superset for visualizing historical transaction data and Apache Hadoop for storage",
      "Apache Spark for scheduled batch analytics and Apache Hive for querying"
    ], 
    c: "Apache Kafka to ingest transaction streams and Apache Flink for real-time processing" 
  },
  { q: "Which characteristic of stream processing addresses the problem of error propagation in batch processing?", 
    a: [
      "Higher operational costs",
      "Error recognition and resolution in real-time",
      "Dynamic scalability",
      "Demanding hardware requirements"
    ], 
    c: "Error recognition and resolution in real-time" 
  },
  { q: "What is one key way Big Data helps improve manufacturing operations?", 
    a: [
      "By automatically hiring new employees",
      "By printing labels faster",
      "By predicting machine failures before they happen",
      "By increasing shelf life of products"
    ], 
    c: "By predicting machine failures before they happen" 
  },

  // --- Set 4 ---
  { q: "In a Convolutional Neural Network (CNN), what is the purpose of the convolution layer?", 
    a: [
      "To flatten the data into a one-dimensional vector",
      "To extract spatial features and patterns from the input",
      "To store past information",
      "To reduce the spatial size of feature maps"
    ], 
    c: "To extract spatial features and patterns from the input" 
  },
  { q: "What problem does Backpropagation Through Time (BPTT) aim to solve?", 
    a: [
      "Training RNNs by computing gradients over multiple time steps",
      "Reducing data volumes in CNNs",
      "Increasing the number of convolution kernels",
      "Differentiating whether the image is a dog or a cat"
    ], 
    c: "Training RNNs by computing gradients over multiple time steps" 
  },
  { q: "What is the primary purpose of an activation function in an artificial neuron?", 
    a: [
      "To calculate the weighted sum of the inputs.",
      "To adjust the learning rate during training.",
      "To introduce non-linearity and map the output to a specific range.",
      "To initialize the weights and biases."
    ], 
    c: "To introduce non-linearity and map the output to a specific range." 
  },

  // --- Set 5 ---
  { q: "During the aggregation process of a neuron, if an input has a weight of 0, what happens?", 
    a: [
      "The neuron's bias is set to zero",
      "The activation function fails",
      "The neuron ignores that particular input signal",
      "The output of the neuron is guaranteed to be zero"
    ], 
    c: "The neuron ignores that particular input signal" 
  },
  { q: "How does Connectionist AI differ from Symbolic AI in terms of learning?", 
    a: [
      "Connectionist AI requires human experts to manually encode rules, while Symbolic AI learns automatically",
      "Connectionist AI learns automatically from examples, while Symbolic AI requires manual rule encoding",
      "Symbolic AI excels in pattern recognition, while Connectionist AI handles logical reasoning",
      "Both store information in human-readable symbols"
    ], 
    c: "Connectionist AI learns automatically from examples, while Symbolic AI requires manual rule encoding" 
  },
  { q: "What is one of the main challenges faced by Connectionist AI models?", 
    a: [
      "They can only process structured data",
      "They require many predefined rules",
      "They are prone to overfitting and generalization issues",
      "They cannot handle high-dimensional data"
    ], 
    c: "They are prone to overfitting and generalization issues" 
  }
];
