import { useI18n } from './i18n';

export default function HomePage() {
    const { t } = useI18n();
    return (
        <main>
            <h1>{t('home.title')}</h1>
            <p>{t('home.init')}</p>
            <p>
                <a href="/onboarding/hard-constraints" style={{ color: 'var(--accent)' }}>{t('nav.onboarding.hard')}</a>
            </p>
            <p>
                <a href="/onboarding/lifestyle" style={{ color: 'var(--accent)' }}>{t('nav.onboarding.lifestyle')}</a>
            </p>
            <p>
                <a href="/onboarding/areas" style={{ color: 'var(--accent)' }}>{t('nav.onboarding.areas')}</a>
            </p>
            <p>
                <a href="/onboarding/wellbeing" style={{ color: 'var(--accent)' }}>{t('nav.onboarding.wellbeing')}</a>
            </p>
            <p>
                <a href="/plan" style={{ color: 'var(--accent)' }}>{t('nav.plan')}</a>
            </p>
            <p>
                <a href="/onboarding/integrations" style={{ color: 'var(--accent)' }}>{t('nav.onboarding.integrations')}</a>
            </p>
        </main>
    );
}


