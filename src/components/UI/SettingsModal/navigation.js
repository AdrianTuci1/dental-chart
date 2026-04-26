import {
    User,
    Building2,
    CreditCard,
    Settings,
    Key,
    FileText,
    Shield,
    Mail,
    LogOut,
} from 'lucide-react';

export const VIEW_CONFIG = {
    profile: { title: 'Account Settings' },
    organizations: { title: 'Clinics & Access' },
    billing: { title: 'Subscription' },
    settings: { title: 'General Settings' },
    api: { title: 'API Configuration' },
    support: { title: 'Support & Legal' },
};

export const SIDEBAR_SECTIONS = [
    {
        tag: 'USER SETTINGS',
        items: [
            { id: 'profile', label: 'Account Settings', icon: User },
            { id: 'organizations', label: 'Clinics & Access', icon: Building2 },
            { id: 'billing', label: 'Subscription', icon: CreditCard },
        ],
    },
    {
        tag: 'APP SETTINGS',
        items: [
            { id: 'settings', label: 'General settings', icon: Settings },
            { id: 'api', label: 'API Key', icon: Key },
        ],
    },
    {
        tag: 'SUPPORT',
        items: [
            { id: 'support', label: 'Support & Legal', icon: FileText },
        ],
    },
];

export const SUPPORT_LINKS = [
    { label: 'Terms of Service', icon: FileText },
    { label: 'Privacy Policy', icon: Shield },
    { label: 'Contact Us', icon: Mail },
];

export const LOGOUT_ACTION = {
    label: 'Log out',
    icon: LogOut,
};
