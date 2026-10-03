const fs = require('fs');

['src/pages/Streak.tsx', 'src/pages/Calendar.tsx', 'src/pages/Quiz.tsx', 'src/pages/Map.tsx', 'src/pages/Settings.tsx'].forEach(path => {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  
  if (!content.includes('PageTransition')) {
    content = 'import PageTransition from \'../components/PageTransition\';\n' + content;
  }
  
  content = content.replace(/return \(\s*<div className="page"/g, 'return (\n    <PageTransition className="page"');
  
  // also replace Map's specific return
  content = content.replace(/return \(\s*<div style={{/g, 'return (\n    <PageTransition style={{');

  // find the last </div>\n  );\n} and replace with </PageTransition>
  content = content.replace(/<\/div>\r?\n\s*\);\r?\n}/, '</PageTransition>\n  );\n}');
  
  fs.writeFileSync(path, content);
});
