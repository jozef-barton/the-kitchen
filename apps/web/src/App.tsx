import { useEffect, useState } from 'react';
import { testModelConfig } from './lib/api';
import { Box, Button, Center, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { useAppController } from './hooks/use-app-controller';
import { ChatPage } from './ui/pages/ChatPage';
import { JobsPage } from './ui/pages/JobsPage';
import { SessionsPage } from './ui/pages/SessionsPage';
import { SkillsPage } from './ui/pages/SkillsPage';
import { RecipesPage } from './ui/pages/RecipesPage';
import { SettingsPage } from './ui/pages/SettingsPage';
import { ToolsPage } from './ui/pages/ToolsPage';
import { ModelSelector } from './ui/molecules/ModelSelector';
import { TabBar } from './ui/molecules/TabBar';
import { ShellLayout, Sidebar } from './ui/templates/ShellLayout';
import { CommandPalette } from './ui/organisms/CommandPalette';
import { AppToaster } from './ui/toaster';

export function App() {
  const controller = useAppController();
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  if (controller.bootstrapStatus === 'loading' && !controller.bootstrap) {
    return (
      <Center h="100dvh" bg="transparent">
        <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-elevated)" px="8" py="7" boxShadow="var(--shadow-md)">
          <Text fontWeight="750" color="var(--text-primary)">
            Connecting to the local Hermes bridge…
          </Text>
          <Text color="var(--text-secondary)">No fallback data is rendered while the real bridge loads.</Text>
        </Box>
      </Center>
    );
  }

  if (controller.bootstrapStatus === 'error' || !controller.bootstrap) {
    return (
      <Center h="100dvh" bg="transparent">
        <VStack
          align="stretch"
          gap="4"
          maxW="560px"
          rounded="8px"
          border="1px solid var(--border-danger)"
          bg="var(--surface-danger)"
          boxShadow="var(--shadow-md)"
          px="8"
          py="8"
        >
          <Text fontSize="2xl" fontWeight="750" color="var(--text-primary)">
            Bridge unavailable
          </Text>
          <Text color="var(--text-secondary)">
            {controller.bootstrapError ?? 'The browser app could not reach the local Hermes bridge.'}
          </Text>
          <Button
            alignSelf="start"
            rounded="8px"
            bg="var(--accent)"
            color="var(--accent-contrast)"
            _hover={{ bg: 'var(--accent-strong)' }}
            onClick={() =>
              void controller.refreshBootstrap({
                preservePage: false,
                openPreferredSession: true
              })
            }
          >
            Retry
          </Button>
        </VStack>
      </Center>
    );
  }

  const subtitle = controller.activeProfile ? controller.activeProfile.description : 'No real Hermes profile is selected.';
  const showRuntimeConfigBlocker =
    controller.activeProfileId !== null &&
    controller.page !== 'recipes' &&
    controller.page !== 'settings' &&
    controller.runtimeConfigGate.status !== 'ready' &&
    !(controller.runtimeConfigGate.status === 'checking' && controller.chatSending);
  const usesCombinedSessionRecipeLayout = controller.page === 'chat' && Boolean(controller.sessionPayload?.attachedRecipe);

  const activeModelLabel = controller.runtimeConfigGate.modelId
    ? `${controller.modelProviderResponse?.config?.provider ?? ''}/${controller.runtimeConfigGate.modelId}`.replace(/^\//, '')
    : null;

  return (
    <>
      {cmdPaletteOpen ? (
        <CommandPalette
          recentSessions={controller.bootstrap.recentSessions}
          onOpenSession={(sessionId) => {
            void controller.openSession(sessionId);
            setCmdPaletteOpen(false);
          }}
          onOpenPage={(page) => {
            void controller.openPage(page);
            setCmdPaletteOpen(false);
          }}
          onCreateSession={() => {
            void controller.handleCreateSession();
            setCmdPaletteOpen(false);
          }}
          onClose={() => setCmdPaletteOpen(false)}
        />
      ) : null}
      <ShellLayout
        connection={controller.bootstrap.connection}
        profileName={controller.activeProfile?.name ?? controller.activeProfile?.id ?? null}
        pageTitle={controller.page === 'chat'
          ? (controller.sessionPayload?.session.title ?? 'Hermes')
          : pageTitle(controller.page)}
        headerDetail={subtitle}
        headerMode={usesCombinedSessionRecipeLayout ? 'compact' : 'full'}
        hermesVersion={controller.bootstrap.hermesVersion}
        expectedHermesVersion={controller.bootstrap.expectedHermesVersion}
        activeModelLabel={activeModelLabel}
        onPersistTheme={async (themeMode) => {
          await controller.handleSaveSettings({
            themeMode
          }, { quiet: true });
        }}
        sidebar={
          <Sidebar
            profiles={controller.bootstrap.profiles}
            activeProfileId={controller.activeProfileId}
            activeSessionId={controller.activeSessionId}
            recentSessions={controller.bootstrap.recentSessions}
            activePage={controller.page}
            collapsed={controller.sidebarCollapsed}
            profileMetrics={controller.profileMetrics}
            onCollapsedChange={(collapsed) => void controller.handleSidebarCollapsedChange(collapsed)}
            onProfileChange={(profileId) => void controller.handleProfileChange(profileId)}
            onCreateSession={() => void controller.handleCreateSession()}
            onOpenSession={(sessionId) => void controller.openSession(sessionId)}
            onOpenPage={(page) => void controller.openPage(page)}
            onRenameSession={(sessionId, title) => void controller.handleRenameSession(sessionId, title)}
            onDeleteSession={(sessionId) => void controller.handleDeleteSession(sessionId)}
            onCreateProfile={(name) => controller.handleCreateProfile(name)}
            onDeleteProfile={(id) => controller.handleDeleteProfile(id)}
          />
        }
        mobileNavContent={
          <Sidebar
            profiles={controller.bootstrap.profiles}
            activeProfileId={controller.activeProfileId}
            activeSessionId={controller.activeSessionId}
            recentSessions={controller.bootstrap.recentSessions}
            activePage={controller.page}
            collapsed={false}
            drawerMode
            profileMetrics={controller.profileMetrics}
            onCollapsedChange={() => undefined}
            onProfileChange={(profileId) => void controller.handleProfileChange(profileId)}
            onCreateSession={() => void controller.handleCreateSession()}
            onOpenSession={(sessionId) => void controller.openSession(sessionId)}
            onOpenPage={(page) => void controller.openPage(page)}
            onRenameSession={(sessionId, title) => void controller.handleRenameSession(sessionId, title)}
            onDeleteSession={(sessionId) => void controller.handleDeleteSession(sessionId)}
            onCreateProfile={(name) => controller.handleCreateProfile(name)}
            onDeleteProfile={(id) => controller.handleDeleteProfile(id)}
          />
        }
        modelSelectorSlot={
          <ModelSelector
            modelProviderResponse={controller.modelProviderResponse}
            activeModelId={controller.runtimeConfigGate.modelId}
          />
        }
        noGutter={controller.page === 'chat'}
        sidebarCollapsed={controller.sidebarCollapsed}
        onToggleSidebar={() => void controller.handleSidebarCollapsedChange(!controller.sidebarCollapsed)}
        tabBar={
          controller.page === 'chat' && controller.openTabs.length >= 2 ? (
            <TabBar
              tabs={controller.openTabs}
              activeTabId={controller.activeSessionId}
              onSelectTab={(sessionId) => void controller.openSession(sessionId)}
              onCloseTab={(sessionId) => controller.closeTab(sessionId)}
              onNewTab={() => void controller.handleCreateSession()}
              onReorderTabs={(reordered) => controller.reorderTabs(reordered)}
            />
          ) : undefined
        }
      >
        {controller.page === 'chat' ? (
          showRuntimeConfigBlocker ? (
            <RuntimeConfigBlockedState
              status={controller.runtimeConfigGate.status}
              code={controller.runtimeConfigGate.code}
              message={controller.runtimeConfigGate.message}
              onOpenSettings={() => void controller.openPage('settings')}
            />
          ) : (
          <ChatPage
            sessionPayload={controller.sessionPayload}
            loading={controller.sessionLoading}
            error={controller.sessionError}
            onSend={controller.handleSendMessage}
            uploadQueue={controller.fileUploadQueue}
            onAddFiles={controller.handleAddFiles}
            sending={controller.chatSending}
            progress={controller.chatProgress}
            activities={controller.chatActivities}
            assistantDraft={controller.assistantDraft}
            chatError={controller.chatError}
            typing={controller.chatAwaitingFinalAssistant}
            selectedActivityRequestId={controller.selectedActivityRequestId}
            selectedActivityPreview={controller.selectedActivityRequest?.preview ?? null}
            selectedActivityStatus={controller.selectedActivityRequest?.status ?? null}
            onFocusActivityRequest={controller.focusActivityRequest}
            runtimeDrawerOpen={controller.recipeRuntimeDrawerOpen}
            onRuntimeDrawerOpenChange={controller.setRecipeRuntimeDrawerOpen}
            onOpenRuntimeRequest={controller.openRecipeRuntimeRequest}
            onRenameSession={(sessionId, title) => void controller.handleRenameSession(sessionId, title)}
            onDeleteSession={(sessionId) => void controller.handleDeleteSession(sessionId)}
            onRenameRecipe={(recipeId, title) => void controller.handleRenameRecipe(recipeId, title)}
            onDeleteRecipe={(recipeId) => void controller.handleDeleteRecipe(recipeId)}
            onRefreshRecipe={(recipe) => void controller.handleRefreshRecipe(recipe)}
            onExecuteRecipeAction={(recipe, actionId, input) => void controller.handleExecuteRecipeAction(recipe, actionId, input)}
            onUpdateRecipe={(recipeId, partial, options) => controller.handleUpdateRecipe(recipeId, partial, options)}
            onApplyRecipeEntryAction={(recipeId, action, entryIds, options) =>
              void controller.handleApplyRecipeEntryAction(recipeId, action, entryIds, options)
            }
            onSwitchTemplate={(recipe, targetTemplateId, intentLabel) =>
              void controller.handleSwitchTemplate(recipe, targetTemplateId, intentLabel)
            }
            activeModelLabel={activeModelLabel}
          />
          )
        ) : null}

        {controller.page === 'sessions' ? (
          showRuntimeConfigBlocker ? (
            <RuntimeConfigBlockedState
              status={controller.runtimeConfigGate.status}
              code={controller.runtimeConfigGate.code}
              message={controller.runtimeConfigGate.message}
              onOpenSettings={() => void controller.openPage('settings')}
            />
          ) : (
          <SessionsPage
            value={controller.sessionsQuery}
            onChange={controller.setSessionsQuery}
            onSearch={() => controller.handleSessionSearch()}
            onPageChange={(page) => controller.handleSessionsPageChange(page)}
            response={controller.sessionsResponse}
            loading={controller.sessionsLoading}
            error={controller.sessionsError}
            onOpenSession={(sessionId) => void controller.openSession(sessionId)}
            onRenameSession={(sessionId, title) => void controller.handleRenameSession(sessionId, title)}
            onDeleteSession={(sessionId) => void controller.handleDeleteSession(sessionId)}
          />
          )
        ) : null}

        {controller.page === 'jobs' ? (
          showRuntimeConfigBlocker ? (
            <RuntimeConfigBlockedState
              status={controller.runtimeConfigGate.status}
              code={controller.runtimeConfigGate.code}
              message={controller.runtimeConfigGate.message}
              onOpenSettings={() => void controller.openPage('settings')}
            />
          ) : (
          <JobsPage
            response={controller.jobsResponse}
            loading={controller.jobsLoading}
            error={controller.jobsError}
            onRefresh={() => void controller.handleJobsRefresh()}
          />
          )
        ) : null}

        {controller.page === 'tools' ? (
          showRuntimeConfigBlocker ? (
            <RuntimeConfigBlockedState
              status={controller.runtimeConfigGate.status}
              code={controller.runtimeConfigGate.code}
              message={controller.runtimeConfigGate.message}
              onOpenSettings={() => void controller.openPage('settings')}
            />
          ) : (
          <ToolsPage
            response={controller.toolsResponse}
            loading={controller.toolsLoading}
            error={controller.toolsError}
            toolsTab={controller.toolsTab}
            onToolsTabChange={(tab) => controller.handleToolsTabChange(tab)}
            toolHistoryResponse={controller.toolHistoryResponse}
            toolHistoryLoading={controller.toolHistoryLoading}
            toolHistoryError={controller.toolHistoryError}
            toolHistoryPage={controller.toolHistoryPage}
            onToolHistoryPageChange={(page) => controller.setToolHistoryPage(page)}
          />
          )
        ) : null}

        {controller.page === 'skills' ? (
          showRuntimeConfigBlocker ? (
            <RuntimeConfigBlockedState
              status={controller.runtimeConfigGate.status}
              code={controller.runtimeConfigGate.code}
              message={controller.runtimeConfigGate.message}
              onOpenSettings={() => void controller.openPage('settings')}
            />
          ) : (
          <SkillsPage
            response={controller.skillsResponse}
            loading={controller.skillsLoading}
            error={controller.skillsError}
            activeProfileId={controller.activeProfileId}
            onRefresh={() => void controller.handleSkillsRefresh()}
            onDeleteSkill={(skill) => void controller.handleDeleteSkill(skill)}
          />
          )
        ) : null}

        {controller.page === 'settings' ? (
          <SettingsPage
            settings={controller.settings}
            accessAudit={controller.accessAudit}
            accessAuditEventsResponse={controller.accessAuditEventsResponse}
            accessAuditEventsLoading={controller.accessAuditEventsLoading}
            accessAuditEventsError={controller.accessAuditEventsError}
            accessAuditEventsPage={controller.accessAuditEventsPage}
            onAccessAuditEventsPageChange={controller.setAccessAuditEventsPage}
            telemetryResponse={controller.telemetryResponse}
            telemetryLoading={controller.telemetryLoading}
            telemetryError={controller.telemetryError}
            telemetryPage={controller.telemetryPage}
            onTelemetryPageChange={controller.setTelemetryPage}
            saving={controller.settingsSaving}
            error={controller.settingsError}
            modelProviderResponse={controller.modelProviderResponse}
            modelProviderLoading={controller.modelProviderLoading}
            modelProviderError={controller.modelProviderError}
            providerDrawerLoading={controller.providerDrawerLoading}
            providerDrawerError={controller.providerDrawerError}
            runtimeConfigGate={controller.runtimeConfigGate}
            inspectedProvider={controller.inspectedProvider}
            onSave={(nextSettings) => controller.handleSaveSettings(nextSettings)}
            onUpdateRuntimeModelConfig={(nextConfig, options) => controller.handleUpdateRuntimeModelConfig(nextConfig, options)}
            onTestModelConfig={(profileId, model, prov) => testModelConfig(profileId, model, prov)}
            onConnectProvider={(provider, apiKey, label, options) => controller.handleConnectProvider(provider, apiKey, label, options)}
            onBeginProviderAuth={(providerId, options) => controller.handleBeginProviderAuth(providerId, options)}
            onPollProviderAuth={(providerId, authSessionId, options) => controller.handlePollProviderAuth(providerId, authSessionId, options)}
            onRefreshProviders={() => controller.handleModelProvidersRefresh()}
            onInspectProvider={(providerId) => controller.handleInspectProvider(providerId)}
            activeProfileId={controller.activeProfileId}
            soulMdContent={controller.soulMdContent}
            soulMdLoading={controller.soulMdLoading}
            soulMdSaving={controller.soulMdSaving}
            soulMdError={controller.soulMdError}
            onLoadSoulMd={(profileId) => controller.loadSoulMd(profileId)}
            onUpdateSoulMd={(content) => controller.handleUpdateSoulMd(content)}
          />
        ) : null}

        {controller.page === 'recipes' ? <RecipesPage activeProfileId={controller.activeProfileId} /> : null}
      </ShellLayout>
      <AppToaster />
    </>
  );
}

function RuntimeConfigBlockedState({
  status,
  code,
  message,
  onOpenSettings
}: {
  status: 'ready' | 'checking' | 'blocked';
  code: string;
  message: string;
  onOpenSettings: () => void;
}) {
  const title =
    status === 'checking'
      ? 'Checking runtime configuration'
      : code === 'runtime_state_unavailable'
        ? 'Hermes runtime configuration unavailable'
        : 'Hermes runtime configuration required';

  return (
    <Center h="100%" minH={0}>
      <VStack
        align="stretch"
        gap="4"
        maxW="640px"
        rounded="8px"
        border={status === 'checking' ? '1px solid rgba(59, 130, 246, 0.28)' : '1px solid var(--border-subtle)'}
        bg={status === 'checking' ? 'rgba(59, 130, 246, 0.08)' : 'var(--surface-elevated)'}
        boxShadow="var(--shadow-md)"
        px="7"
        py="7"
      >
        {status === 'checking' ? (
          <HStack align="center" gap="3">
            <Spinner size="sm" color="blue.500" />
            <Text fontSize="2xl" fontWeight="750" color="var(--text-primary)">
              {title}
            </Text>
          </HStack>
        ) : (
          <Text fontSize="2xl" fontWeight="750" color="var(--text-primary)">
            {title}
          </Text>
        )}
        <Text color="var(--text-secondary)">
          {message ||
            'Configure at least one usable provider and model in Settings before using chat, jobs, tools, or skills.'}
        </Text>
        {status === 'checking' ? null : (
          <Button
            alignSelf="start"
            rounded="8px"
            bg="var(--accent)"
            color="var(--accent-contrast)"
            _hover={{ bg: 'var(--accent-strong)' }}
            onClick={onOpenSettings}
          >
            Open Settings
          </Button>
        )}
      </VStack>
    </Center>
  );
}

function pageTitle(page: string) {
  switch (page) {
    case 'sessions': return 'Sessions';
    case 'recipes': return 'Recipes';
    case 'jobs': return 'Jobs';
    case 'tools': return 'Tools';
    case 'skills': return 'Skills';
    case 'settings': return 'Settings';
    default: return 'Chat';
  }
}
