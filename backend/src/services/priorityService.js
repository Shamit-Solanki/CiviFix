export function calculatePriority({severity,supporters,createdAt}){
 const days=Math.max(0,Math.floor((Date.now()-new Date(createdAt).getTime())/86400000));
 return Math.min(100,severity*10+supporters*2+days*3);
}
