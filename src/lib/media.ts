// Media paths in course.json are stored app-root-relative (e.g. "media/w01-briefing/lesson.mp4",
// no leading slash) so they work whether the app is served at "/" or under a deployment subpath
// such as "/OSAPHLA/". Resolve them against Vite's BASE_URL before use.
export function mediaUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}
