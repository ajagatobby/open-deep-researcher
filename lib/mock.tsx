import { Sparkles, TrendingUp } from "lucide-react";

export const markdown = `# Beautiful Markdown Component

### Features

This component supports a wide range of Markdown features with beautiful styling:

- **Bold text** and *italic text*
- [Links](https://example.com) to external resources
- Images with captions

![Beautiful landscape](https://plus.unsplash.com/premium_photo-1737659209063-32e2b1a385a5?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D "Scenic mountain view")

### Lists

1. Ordered lists
2. With multiple items
   - And nested items
   - With proper indentation

### Blockquotes

> This is a blockquote.
> 
> It can span multiple lines and is styled beautifully.

### Tables

| Feature | Support | Notes |
|---------|---------|-------|
| Basic Markdown | ✅ | Full support |
| GFM Tables | ✅ | With styling |
| Code Highlighting | ✅ | Multiple languages |
| Math Equations | ✅ | Using KaTeX |

### Code Blocks

hello world what is popping

\`\`\`javascript
// This is a code block with syntax highlighting
function greeting(name) {
  return \`Hello, \${name}!\`;
}

// The component includes a copy button
const message = greeting('Developer');
console.log(message); // Outputs: Hello, Developer!
\`\`\`


### Inline Code

You can also use \`inline code\` within paragraphs.

### Mathematical Expressions

This component supports math expressions using KaTeX:

Inline math: $E = mc^2$

Block math:

$$
\\frac{\\partial u}{\\partial t} = h^2 \\left( \\frac{\\partial^2 u}{\\partial x^2} + \\frac{\\partial^2 u}{\\partial y^2} + \\frac{\\partial^2 u}{\\partial z^2}\\right)
$$

---

## Implementation Details

This component uses:
- \`react-markdown\` for rendering Markdown
- \`react-syntax-highlighter\` for code highlighting
- \`remark-gfm\` for GitHub Flavored Markdown support (tables, task lists)
- \`remark-math\` and \`rehype-katex\` for math expressions
- \`rehype-raw\` for HTML support
- Custom styling with Tailwind CSS classes
  `;

const suggestions = [
  {
    title: "Coding Topics",
    icon: <TrendingUp className="h-3 w-3" />,
    items: [
      "Solve a two sum of an array problem in f#",
      "Explain cryptography in simplest term possible",
      "Build me a simple todo list in swiftUI",
    ],
  },
  {
    title: "Thought-Provoking",
    icon: <Sparkles className="h-3 w-3" />,
    items: [
      "Consciousness in artificial systems",
      "The future of human augmentation",
      "Solving Fermi Paradox with new observations",
    ],
  },
  {
    title: "Emerging Fields",
    icon: <Sparkles className="h-3 w-3" />,
    items: [
      "Geometric deep learning applications",
      "Xenobots and living robots",
      "Psychedelics in treatment-resistant depression",
    ],
  },
];

const mobileSuggestions = [
  {
    title: "Trending Topics",
    icon: <TrendingUp className="h-3 w-3" />,
    items: [
      "Generative AI's impact on creative industries",
      "Blue carbon ecosystems and climate mitigation",
      "Neuroplasticity in adults over 50",
    ],
  },
];

const sources = [
  {
    title: "The Art of Computer Programming",
    url: "https://www-cs-faculty.stanford.edu/~knuth/taocp.html",
  },
  {
    title: "Thinking, Fast and Slow",
    url: "https://www.penguinrandomhouse.com/books/89308/thinking-fast-and-slow-by-daniel-kahneman/",
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    url: "https://www.ynharari.com/book/sapiens-2/",
  },
  {
    title: "The Design of Everyday Things",
    url: "https://www.nngroup.com/books/design-everyday-things-revised/",
  },
  { title: "Atomic Habits", url: "https://jamesclear.com/atomic-habits" },
  { title: "Deep Work", url: "https://www.calnewport.com/books/deep-work/" },
  {
    title: "Educated: A Memoir",
    url: "https://www.penguinrandomhouse.com/books/550168/educated-by-tara-westover/",
  },
  {
    title: "The Pragmatic Programmer",
    url: "https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/",
  },
  { title: "Algorithms to Live By", url: "https://algorithmstoliveby.com/" },
  {
    title: "A Brief History of Time",
    url: "https://www.penguinrandomhouse.com/books/70021/a-brief-history-of-time-by-stephen-hawking/",
  },
];

const keywords = [
  "machine learning",
  "productivity",
  "cognitive bias",
  "design thinking",
  "habit formation",
  "deep focus",
  "self-education",
  "software development",
  "algorithmic thinking",
  "theoretical physics",
];

// Added thinking text
const thinkingText =
  "Analyzing cognitive biases in decision-making processes and how they affect productivity and habit formation in knowledge workers. Looking for connections between algorithmic thinking and problem-solving approaches in design thinking methodologies.";

// Added current query
const currentQuery =
  "How do cognitive biases affect productivity and what techniques from cognitive science can help overcome these limitations?";

export {
  suggestions,
  mobileSuggestions,
  keywords,
  thinkingText,
  sources,
  currentQuery,
};
