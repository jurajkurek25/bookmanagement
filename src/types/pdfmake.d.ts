declare module "pdfmake/build/pdfmake" {
  const pdfMake: {
    addVirtualFileSystem(vfs: Record<string, string>): void;
    createPdf(def: Record<string, unknown>): { getBlob(): Promise<Blob> };
  };
  export default pdfMake;
}
declare module "pdfmake/build/vfs_fonts" {
  const vfs: Record<string, string>;
  export default vfs;
}
