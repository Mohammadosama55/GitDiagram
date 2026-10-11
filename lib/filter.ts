const IGNORED_DIRS = new Set([
  "node_modules", "dist", "build", ".next", ".git", "coverage",
  "vendor", "__pycache__", "uploads", "attached_assets",
]);

const IGNORED_FILES = new Set([
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
]);

const IGNORED_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ".pdf", ".woff", ".woff2", ".ttf", ".mp4", ".zip", ".map",
];

export function filterTree(paths: string[]): string[] {
  return paths.filter((path) => {
    const parts = path.split("/");
    const fileName = parts[parts.length - 1].toLowerCase();

    if (parts.slice(0, -1).some((dir) => IGNORED_DIRS.has(dir))) return false;
    if (IGNORED_FILES.has(fileName)) return false;
    if (IGNORED_EXTENSIONS.some((ext) => fileName.endsWith(ext))) return false;

    return true;
  });
}