function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Scripting')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ====== BACKEND API ======
const FOLDER_NAME = 'Scripting_Files';
function getFolder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}
function saveFile(name, content) {
  try {
    if (!name || !name.trim()) return { success:false, message:'Nama kosong' };
    const folder = getFolder_();
    const fileName = /\.(js|gs)$/.test(name) ? name : name + '.js';
    const files = folder.getFilesByName(fileName);
    let file = files.hasNext() ? (f => (f.setContent(content), f))(files.next())
                               : folder.createFile(fileName, content, MimeType.PLAIN_TEXT);
    return { success:true, message:'Tersimpan: '+fileName, name:fileName, id:file.getId() };
  } catch(e) { return { success:false, message:e.message }; }
}
function loadFile(name) {
  try {
    const it = getFolder_().getFilesByName(name);
    if (!it.hasNext()) return { success:false, message:'Tidak ditemukan' };
    const f = it.next();
    return { success:true, name:f.getName(), content:f.getBlob().getDataAsString() };
  } catch(e) { return { success:false, message:e.message }; }
}
function listFiles() {
  try {
    const files = getFolder_().getFiles(), out = [];
    while (files.hasNext()) { const f = files.next();
      out.push({ name:f.getName(), updated:f.getLastUpdated().toISOString() }); }
    return { success:true, files: out.sort((a,b)=>a.name.localeCompare(b.name)) };
  } catch(e) { return { success:false, message:e.message, files:[] }; }
}
function deleteFile(name) {
  try {
    const it = getFolder_().getFilesByName(name);
    if (!it.hasNext()) return { success:false, message:'Tidak ada' };
    it.next().setTrashed(true);
    return { success:true, message:'Dihapus: '+name };
  } catch(e) { return { success:false, message:e.message }; }
}
function runCode(code) {
  try {
    const result = eval(`(function(){
      const __logs=[];
      const console={log:(...a)=>__logs.push(a.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(' ')),
                     error:(...a)=>__logs.push('ERROR: '+a.join(' ')),
                     warn:(...a)=>__logs.push('WARN: '+a.join(' '))};
      try { ${code} } catch(e){ __logs.push('Exception: '+e.message); }
      return __logs;
    })()`);
    return { success:true, output: result };
  } catch(e) { return { success:false, output:['Error: '+e.message] }; }
}