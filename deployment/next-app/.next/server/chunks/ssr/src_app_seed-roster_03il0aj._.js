module.exports=[71535,a=>{a.v({button:"page-module__k04Uyq__button",codeBlock:"page-module__k04Uyq__codeBlock",container:"page-module__k04Uyq__container",error:"page-module__k04Uyq__error",guideArea:"page-module__k04Uyq__guideArea",header:"page-module__k04Uyq__header",inputArea:"page-module__k04Uyq__inputArea",loginStatus:"page-module__k04Uyq__loginStatus",note:"page-module__k04Uyq__note",pageWrapper:"page-module__k04Uyq__pageWrapper",splitLayout:"page-module__k04Uyq__splitLayout",status:"page-module__k04Uyq__status",textarea:"page-module__k04Uyq__textarea"})},39925,a=>{"use strict";var b=a.i(87924),c=a.i(72131),d=a.i(60026),e=a.i(16121);a.i(69387);var f=a.i(2152),g=a.i(1787),h=a.i(71535);a.s(["default",0,function(){let{user:a}=(0,d.useAuth)(),[i,j]=(0,c.useState)(""),[k,l]=(0,c.useState)(""),[m,n]=(0,c.useState)(!1),o=`[
  {
    "email": "student1@example.com",
    "role": "student",
    "classId": "FY-CS-A"
  },
  {
    "email": "teacher1@example.com",
    "role": "teacher",
    "assignments": [
      { "classId": "FY-CS-A", "subject": "Math" },
      { "classId": "FY-CS-B", "subject": "Math" }
    ]
  }
]`,p=async()=>{if(!a)return void l("You must be logged in!");try{n(!0),l("Parsing JSON...");let a=JSON.parse(i);if(!Array.isArray(a))throw Error("Input must be a JSON array.");l(`Processing ${a.length} records...`);for(let b=0;b<a.length;b++){let c=a[b];if(!c.email)continue;let d=c.email.toLowerCase();await (0,g.setDoc)((0,f.doc)(e.db,"roster",d),c),l(`Saved ${b+1}/${a.length}: ${c.email}`)}l("✅ All records seeded to the roster successfully!")}catch(a){l("❌ Error: "+a.message),console.error(a)}finally{n(!1)}};return(0,b.jsxs)("div",{className:h.default.container,children:[(0,b.jsxs)("div",{className:h.default.header,children:[(0,b.jsx)("h1",{children:"Roster Management"}),(0,b.jsx)("p",{children:"Bulk upload student and teacher assignments via JSON. They will be auto-assigned upon their next login."})]}),a?(0,b.jsxs)("div",{className:h.default.formSection,children:[(0,b.jsxs)("p",{className:h.default.loginStatus,children:["✓ Logged in as: ",a.email]}),(0,b.jsxs)("div",{className:h.default.splitLayout,children:[(0,b.jsxs)("div",{className:h.default.inputArea,children:[(0,b.jsx)("label",{children:"Paste JSON Array Here:"}),(0,b.jsx)("textarea",{value:i,onChange:a=>j(a.target.value),placeholder:"Paste your JSON here...",className:h.default.textarea}),(0,b.jsx)("button",{onClick:p,disabled:m||!i,className:h.default.button,children:m?"Seeding Database...":"Upload Roster"}),(0,b.jsx)("p",{className:h.default.status,children:k})]}),(0,b.jsxs)("div",{className:h.default.guideArea,children:[(0,b.jsx)("h3",{children:"Format Guide"}),(0,b.jsx)("pre",{className:h.default.codeBlock,children:o}),(0,b.jsxs)("p",{className:h.default.note,children:[(0,b.jsx)("b",{children:"Note:"})," You can upload students for all 5 classes simultaneously in one large array. Ensure emails are spelled correctly."]})]})]})]}):(0,b.jsx)("p",{className:h.default.error,children:"⚠️ You must log in first to use this utility."})]})}])}];

//# sourceMappingURL=src_app_seed-roster_03il0aj._.js.map