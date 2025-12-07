export function isJuxinHost(u: string): boolean {
  try {
    const h = new URL(u).hostname.toLowerCase();
    return h.endsWith("jxincm.cn") || h.endsWith("filesystem.site");
  } catch {
    return false;
  }
}
