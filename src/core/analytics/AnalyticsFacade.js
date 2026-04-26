import { analyticsProxy } from './AnalyticsProxy';

export const AnalyticsFacade = {
    setUser: (user) => analyticsProxy.setUser(user),

    trackPageView: (pathname) => analyticsProxy.track('page_viewed', {
        category: 'navigation',
        metadata: { pathname },
    }),

    trackSessionStarted: (pathname) => analyticsProxy.track('app_session_started', {
        category: 'session',
        metadata: { pathname },
    }),

    trackSessionHeartbeat: (pathname) => analyticsProxy.track('app_session_heartbeat', {
        category: 'session',
        metadata: { pathname },
    }),

    trackVisibilityChange: (state, pathname) => analyticsProxy.track(
        state === 'visible' ? 'app_foregrounded' : 'app_backgrounded',
        {
            category: 'session',
            metadata: { pathname },
        }
    ),

    trackLoginCompleted: ({ id, subscriptionPlan }) => analyticsProxy.track('login_completed', {
        category: 'auth',
        entityType: 'medic',
        entityId: id,
        metadata: {
            plan: subscriptionPlan || null,
        },
    }),

    trackOnboardingCompleted: ({ id, subscriptionPlan }) => analyticsProxy.track('onboarding_completed', {
        category: 'onboarding',
        entityType: 'medic',
        entityId: id,
        metadata: {
            plan: subscriptionPlan || null,
        },
    }),

    trackSettingsOpened: (medicId) => analyticsProxy.track('settings_opened', {
        category: 'navigation',
        entityType: 'medic',
        entityId: medicId || null,
    }),

    trackMenuClicked: ({ patientId, menuName }) => analyticsProxy.track('menu_clicked', {
        category: 'navigation',
        entityType: 'patient',
        entityId: patientId,
        metadata: { menuName },
    }),

    trackPatientCreated: (patient) => analyticsProxy.track('patient_created', {
        category: 'patient',
        clinicId: patient?.clinicId || null,
        entityType: 'patient',
        entityId: patient?.id || null,
    }),

    trackPatientDeleted: (patientId) => analyticsProxy.track('patient_deleted', {
        category: 'patient',
        entityType: 'patient',
        entityId: patientId,
    }),

    trackHistoryRecordAdded: ({ patientId, item }) => analyticsProxy.track('history_record_added', {
        category: 'treatment',
        entityType: 'patient',
        entityId: patientId,
        metadata: {
            treatmentType: item?.type || null,
            procedure: item?.procedure || null,
        },
    }),

    trackTreatmentPlanItemAdded: ({ patientId, item }) => analyticsProxy.track('treatment_plan_item_added', {
        category: 'treatment',
        entityType: 'patient',
        entityId: patientId,
        metadata: {
            treatmentType: item?.type || null,
            procedure: item?.procedure || null,
        },
    }),
};
