import {EventFixture} from 'sentry-fixture/event';
import {EventsStatsFixture} from 'sentry-fixture/events';
import {GroupFixture} from 'sentry-fixture/group';
import {OrganizationFixture} from 'sentry-fixture/organization';
import {ProjectFixture} from 'sentry-fixture/project';
import {RepositoryFixture} from 'sentry-fixture/repository';
import {TagsFixture} from 'sentry-fixture/tags';

import {render, screen} from 'sentry-test/reactTestingLibrary';

import PageFiltersStore from 'sentry/stores/pageFiltersStore';
import ProjectsStore from 'sentry/stores/projectsStore';
import {EventDetails} from 'sentry/views/issueDetails/streamline/eventDetails';

jest.mock('sentry/views/issueDetails/groupEventDetails/groupEventDetailsContent');
jest.mock('screenfull', () => ({
  enabled: true,
  isFullscreen: false,
  request: jest.fn(),
  exit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
}));

describe('EventDetails', function () {
  const organization = OrganizationFixture();
  const project = ProjectFixture();
  const group = GroupFixture();
  const event = EventFixture({id: 'event-id'});
  const committer = {
    author: {name: 'Butter the Dog', id: '2021'},
    commits: [
      {
        message: 'fix(training): Adjust noise level for meeting other dogs (#2024)',
        id: 'ab2709293d0c9000829084ac7b1c9221fb18437c',
        dateCreated: '2024-09-09T04:15:12',
        repository: RepositoryFixture(),
      },
    ],
  };
  const defaultProps = {project, group, event};

  beforeEach(function () {
    PageFiltersStore.init();
    PageFiltersStore.onInitializeUrlState(
      {
        projects: [],
        environments: [],
        datetime: {start: null, end: null, period: '14d', utc: null},
      },
      new Set(['environments'])
    );
    ProjectsStore.loadInitialData([project]);
    MockApiClient.clearMockResponses();
    MockApiClient.addMockResponse({
      url: `/projects/${organization.slug}/${project.slug}/events/${event.id}/actionable-items/`,
      body: {errors: []},
      method: 'GET',
    });
    MockApiClient.addMockResponse({
      url: `/projects/${organization.slug}/${project.slug}/events/${event.id}/committers/`,
      body: {committers: [committer]},
      method: 'GET',
    });
    MockApiClient.addMockResponse({
      url: `/organizations/${organization.slug}/issues/${group.id}/tags/`,
      body: TagsFixture(),
      method: 'GET',
    });
    MockApiClient.addMockResponse({
      url: `/organizations/${organization.slug}/events-stats/`,
      body: {'count()': EventsStatsFixture(), 'count_unique(user)': EventsStatsFixture()},
      method: 'GET',
    });
  });

  it('displays all basic components', async function () {
    render(<EventDetails {...defaultProps} />, {organization});
    await screen.findByText(event.id);
    // Suspect Commits
    expect(screen.getByText('Suspect Commit')).toBeInTheDocument();
    expect(screen.getByText(committer.author.name)).toBeInTheDocument();
    // Filtering
    expect(screen.getByTestId('page-filter-environment-selector')).toBeInTheDocument();
    expect(screen.getByLabelText('Search events')).toBeInTheDocument();
    expect(screen.getByTestId('page-filter-timerange-selector')).toBeInTheDocument();
    // Graph
    expect(screen.getByRole('figure')).toBeInTheDocument();
    // Navigation
    expect(screen.getByRole('tab', {name: 'Recommended Event'})).toBeInTheDocument();
    expect(screen.getByRole('tab', {name: 'First Event'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Next Event'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'View All Events'})).toBeInTheDocument();
  });
});
