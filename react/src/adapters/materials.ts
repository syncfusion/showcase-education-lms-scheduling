// Maps the nested fixtures.json files tree onto File Manager flat FileData.
// Fixtures store a nested tree; File Manager reads flat parentId rows.
// Dates are anchored to the Clock seed so the library does not depend on "now".

export interface FixtureFileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  sizeBytes?: number;
  /** Days after the clock seed. Gives the library distinct modified dates. */
  modifiedOffsetDays?: number;
  children?: FixtureFileNode[];
}

/** Row shape consumed by FileManagerComponent.fileSystemData (flat mode). */
export interface MaterialFile {
  id: string;
  name: string;
  parentId: string | null;
  isFile: boolean;
  size: number;
  type: string;
  dateCreated: Date;
  dateModified: Date;
  filterPath: string;
  hasChild: boolean;
}

export function readFixtureFiles(fixture: object): FixtureFileNode | null {
  const files = (fixture as { files?: FixtureFileNode }).files;
  if (!files || typeof files.id !== 'string' || typeof files.name !== 'string') return null;
  return files;
}

export function flattenMaterials(root: FixtureFileNode, seed: Date): MaterialFile[] {
  const rows: MaterialFile[] = [];
  const visit = (node: FixtureFileNode, parentId: string | null, filterPath: string) => {
    const isFile = node.type === 'file';
    const children = node.children ?? [];
    const stamp = shifted(seed, node.modifiedOffsetDays ?? 0);
    rows.push({
      id: node.id,
      name: node.name,
      parentId,
      isFile,
      size: isFile ? (node.sizeBytes ?? 0) : 0,
      type: isFile ? fileType(node.name) : 'folder',
      dateCreated: stamp,
      dateModified: new Date(stamp.getTime()),
      filterPath,
      // FileManager's navigation tree only shows a folder's expand/collapse caret when
      // hasChild is true, and it removes the caret when an expand returns no subfolders.
      // A folder whose children are all files (e.g. Syllabus) must therefore report
      // hasChild: false, otherwise its caret disappears on the first expand click.
      hasChild: !isFile && children.some(child => child.type === 'folder'),
    });
    for (const child of children) {
      // Root's own parent is null, so its children use the control's "\\" path.
      // Deeper items use parent filterPath + parent name + "\\", matching createNewItem.
      const childPath = parentId === null ? '\\' : `${filterPath}${node.name}\\`;
      visit(child, node.id, childPath);
    }
  };
  visit(root, null, '');
  return rows;
}

function shifted(seed: Date, days: number): Date {
  const date = new Date(seed.getTime());
  date.setDate(date.getDate() + days);
  return date;
}

function fileType(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}
