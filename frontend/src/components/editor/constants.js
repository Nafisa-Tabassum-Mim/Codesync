export const CODE_SNIPPETS = {
  javascript: `function greet(name) {\n    console.log("Hello, " + name + "!");\n}\n\ngreet("Alex");\n`,
  typescript: `type Params = {\n    name: string;\n}\n\nfunction greet(data: Params) {\n    console.log("Hello, " + data.name + "!");\n}\n\ngreet({ name: "Alex" });\n`,
  python: `def greet(name):\n    print("Hello, " + name + "!")\n\ngreet("Alex")\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}\n`,
};

export const FILE_NAMES = {
  python: 'main.py',
  javascript: 'main.js',
  typescript: 'main.ts',
  java: 'Main.java',
}

// matches the runtimes in the backend's RUNNERS
export const LANGUAGE_LABELS = {
  python: 'Python 3.12',
  javascript: 'JavaScript (Node 20)',
  typescript: 'TypeScript (Node 24)',
  java: 'Java 21',
}

export const THEMES = [
  { id: 'codesync-dark', label: 'CodeSync Dark' },
  { id: 'vs-dark', label: 'VS Dark' },
  { id: 'light', label: 'Light' },
  { id: 'hc-black', label: 'High Contrast' },
]
