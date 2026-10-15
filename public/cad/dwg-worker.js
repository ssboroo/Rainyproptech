// LibreDWG runs in an isolated, cancellable worker. Files never leave this browser.
import {
  LibreDwg,
  Dwg_File_Type,
  createModule,
} from "/vendor/cad/dist/libredwg-web.js";
self.onmessage = async ({ data }) => {
  try {
    const module = await createModule({
      locateFile: (name) => `/vendor/cad/wasm/${name}`,
      INITIAL_MEMORY: 64 * 1024 * 1024,
      print: () => {},
      printErr: () => {},
    });
    const reader = LibreDwg.createByWasmInstance(module);
    const ptr = reader.dwg_read_data(data, Dwg_File_Type.DWG);
    if (!ptr) throw new Error("DWG could not be decoded");
    try {
      const { database, stats } = reader.convertEx(ptr);
      const svg = reader.dwg_to_svg(database);
      self.postMessage({
        type: "svg",
        svg,
        warning: stats.unknownEntityCount
          ? `${stats.unknownEntityCount} unsupported entities`
          : "",
      });
    } finally {
      reader.dwg_free(ptr);
    }
  } catch {
    self.postMessage({ error: "DWG_READ_FAILED" });
  }
};
