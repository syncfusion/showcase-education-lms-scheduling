// Content & Materials: term library for the Gantt courses. File Manager is the page.
// The tree is in-memory flat data. Nothing is uploaded and nothing is written to disk.
import { useEffect, useState } from 'react';
import {
  FileManagerComponent, Inject, NavigationPane, Toolbar, DetailsView, LargeIconsView, ContextMenu,
  type FileOpenEventArgs, type BeforeDownloadEventArgs,
} from '@syncfusion/ej2-react-filemanager';
import { useApp } from '../../application/app-context';
import { ContentSkeleton } from '../route-skeletons';

const MATERIALS_TOOLBAR = ['NewFolder', 'Delete', 'Rename', 'SortBy', 'Refresh', 'Selection', 'View', 'Details'];
// File Manager's own phone layout follows the user agent, not the viewport.
// This page uses its own breakpoint: Large Icons and no folder tree below 768px.
const MOBILE_CONTENT = '(max-width: 767.98px)';

function useMobileContent(): boolean {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_CONTENT).matches);
  useEffect(() => {
    const query = window.matchMedia(MOBILE_CONTENT);
    const apply = () => setMobile(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);
  return mobile;
}

export function Content() {
  const { store, revision } = useApp();
  const mobile = useMobileContent();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 600);
    return () => window.clearTimeout(timer);
  }, []);

  function onFileOpen(args: FileOpenEventArgs) {
    const details = args.fileDetails as { isFile?: boolean } | undefined;
    if (details?.isFile) args.cancel = true;
  }

  function onBeforeDownload(args: BeforeDownloadEventArgs) {
    args.cancel = true;
  }

  if (!loaded) return <ContentSkeleton />;

  return (
    <div className="page page-content" data-session={revision}>
      <div className="page-toolbar">
        <div className="page-heading">
          <h1 className="page-title">Content &amp; Materials</h1>
          <p className="page-description">Syllabus, notes, labs, and recordings for the term plan.</p>
        </div>
      </div>
      <section className="e-card content-card content-card-files" aria-label="Term course materials">
        <div className="e-card-header">
          <div className="e-card-header-caption">
            <div className="e-card-header-title">Term materials</div>
            <div className="e-card-sub-title">Search, select, sort, rename, or delete. Changes stay in this tab.</div>
          </div>
        </div>
        <div className="e-card-content content-card-body">
          <div className="content-control">
            <FileManagerComponent
              id="materials-browser"
              key={`${store.materialsEpoch}-${mobile ? 'mobile' : 'wide'}`}
              fileSystemData={store.fileSystemData as unknown as { [key: string]: Object }[]}
              path="/"
              view={mobile ? 'LargeIcons' : 'Details'}
              height="100%"
              allowMultiSelection={true}
              showItemCheckBoxes={true}
              sortBy="name"
              sortOrder="Ascending"
              allowDragAndDrop={false}
              enablePersistence={false}
              searchSettings={{ allowSearchOnTyping: true, filterType: 'contains', ignoreCase: true }}
              navigationPaneSettings={mobile
                ? { visible: false }
                : { visible: true, minWidth: '220px', maxWidth: '280px' }}
              detailsViewSettings={{
                columns: [
                  { field: 'name', headerText: 'Name', minWidth: 120, width: '180' },
                  { field: 'type', headerText: 'Type', minWidth: 72, width: '88' },
                  { field: 'size', headerText: 'Size', minWidth: 80, width: '96' },
                  { field: '_fm_modified', headerText: 'Date Modified', type: 'dateTime', format: 'MMM dd, yyyy', minWidth: 120, width: '150' },
                ],
              }}
              toolbarSettings={{ items: MATERIALS_TOOLBAR, visible: true }}
              contextMenuSettings={{
                file: ['Delete', 'Rename', '|', 'Details'],
                folder: ['Open', '|', 'Delete', 'Rename', '|', 'Details'],
                layout: ['SortBy', 'View', 'Refresh', '|', 'NewFolder', '|', 'SelectAll', 'Details'],
                visible: true,
              }}
              fileOpen={onFileOpen}
              beforeDownload={onBeforeDownload}
              beforePopupOpen={(args) => { if (args.popupName === 'Upload') args.cancel = true; }}
              beforeSend={(args) => { if (args.action === 'Upload') args.cancel = true; }}
              folderCreate={() => store.noteMaterialsChanged()}
              delete={() => store.noteMaterialsChanged()}
              rename={() => store.noteMaterialsChanged()}
              aria-label="Term course materials"
            >
              <Inject services={[NavigationPane, Toolbar, DetailsView, LargeIconsView, ContextMenu]} />
            </FileManagerComponent>
          </div>
        </div>
      </section>
      <p className="app-footnote">Changes stay in this tab.</p>
    </div>
  );
}

export default Content;
