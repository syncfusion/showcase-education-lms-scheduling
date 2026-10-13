// Route skeletons live in the main bundle so navigation can show them before a lazy page chunk arrives.
// Markup matches the layout each page already used while its fixture timer ran.

import { SkeletonComponent } from '@syncfusion/ej2-react-notifications';

export type AppRouteId = 'dashboard' | 'schedule' | 'plan' | 'content' | 'students';

export function DashboardSkeleton() {
  return (
    <div className="page page-dashboard" aria-busy="true">
      <div className="page-toolbar" aria-hidden="true">
        <div className="page-heading">
          <SkeletonComponent shape="Text" className="page-title-skeleton" />
          <SkeletonComponent shape="Text" className="page-description-skeleton" />
        </div>
        <SkeletonComponent shape="Rectangle" height="32px" width="180px" />
      </div>
      <div className="kpi-grid">
        {[0, 1, 2, 3].map(i => (
          <SkeletonComponent key={`kpi${i}`} shape="Rectangle" className="page-kpi-skeleton-static" aria-label={undefined} />
        ))}
      </div>
      <div className="tile-grid-skeleton">
        {[0, 1].map(i => <SkeletonComponent key={`tile${i}`} shape="Rectangle" className="page-tile-skeleton-static" />)}
      </div>
    </div>
  );
}

export function ScheduleSkeleton() {
  return (
    <div className="page page-schedule" aria-busy="true">
      <div className="page-toolbar" aria-hidden="true">
        <div className="page-heading">
          <SkeletonComponent shape="Text" className="page-title-skeleton" />
          <SkeletonComponent shape="Text" className="page-description-skeleton" />
        </div>
      </div>
      <div className="grid-skeleton">
        <div className="grid-skeleton-header">
          {[0, 1, 2, 3, 4, 5].map(i => <SkeletonComponent key={`h${i}`} shape="Text" width={`${7 + i * 3}%`} />)}
        </div>
        {Array.from({ length: 6 }, (_, r) => (
          <div className="grid-skeleton-row" key={r}>
            {[0, 1, 2, 3, 4, 5].map(i => <SkeletonComponent key={`${r}-${i}`} shape="Rectangle" className="schedule-skeleton-cell" />)}
          </div>
        ))}
      </div>
      <span className="visually-hidden">Loading class schedule</span>
    </div>
  );
}

export function PlanSkeleton() {
  return (
    <div className="page page-plan" aria-busy="true">
      <div className="page-toolbar" aria-hidden="true">
        <div className="page-heading">
          <SkeletonComponent shape="Text" className="page-title-skeleton" />
          <SkeletonComponent shape="Text" className="page-description-skeleton" />
        </div>
      </div>
      <div className="grid-skeleton">
        {Array.from({ length: 9 }, (_, r) => (
          <div className="grid-skeleton-row" key={r}>
            <SkeletonComponent shape="Text" className="gantt-skeleton-label" />
            <SkeletonComponent shape="Rectangle" className="gantt-skeleton-bar" style={{ marginLeft: `${r * 24}px` }} />
          </div>
        ))}
      </div>
      <span className="visually-hidden">Loading course plan</span>
    </div>
  );
}

export function ContentSkeleton() {
  return (
    <div className="page page-content" aria-busy="true">
      <div className="page-toolbar" aria-hidden="true">
        <div className="page-heading">
          <SkeletonComponent shape="Text" className="page-title-skeleton" />
          <SkeletonComponent shape="Text" className="page-description-skeleton" />
        </div>
      </div>
      <SkeletonComponent shape="Rectangle" className="content-skeleton" aria-label="Loading course materials" />
      <span className="visually-hidden">Loading content</span>
    </div>
  );
}

export function StudentsSkeleton() {
  return (
    <div className="page page-students" aria-busy="true">
      <div className="page-toolbar" aria-hidden="true">
        <div className="page-heading">
          <SkeletonComponent shape="Text" className="page-title-skeleton" />
          <SkeletonComponent shape="Text" className="page-description-skeleton" />
        </div>
        <SkeletonComponent shape="Rectangle" height="32px" width="180px" />
      </div>
      <div className="grid-skeleton" role="presentation">
        <div className="grid-skeleton-header">
          {[0, 1, 2, 3, 4, 5].map(i => <SkeletonComponent key={`h${i}`} shape="Text" width={`${8 + i * 4}%`} />)}
        </div>
        {Array.from({ length: 8 }, (_, r) => (
          <div className="grid-skeleton-row" key={r}>
            {[0, 1, 2, 3, 4, 5].map(i => <SkeletonComponent key={`${r}-${i}`} shape="Text" className="grid-skeleton-cell" />)}
          </div>
        ))}
      </div>
      <span className="visually-hidden">Loading student roster</span>
    </div>
  );
}

const BY_ROUTE = {
  dashboard: DashboardSkeleton,
  schedule: ScheduleSkeleton,
  plan: PlanSkeleton,
  content: ContentSkeleton,
  students: StudentsSkeleton,
} as const;

export function RouteSkeleton({ route }: { route: AppRouteId }) {
  const Skeleton = BY_ROUTE[route];
  return <Skeleton />;
}
