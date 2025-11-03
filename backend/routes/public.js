const express = require('express');
const router = express.Router();
const Guild = require('../models/Guild');
const User = require('../models/User');

// Get public statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = {
            totalServers: await Guild.countDocuments({ isActive: true }),
            totalUsers: await User.countDocuments(),
            premiumServers: await Guild.countDocuments({ isPremium: true }),
            totalCommands: await Guild.aggregate([
                { $group: { _id: null, total: { $sum: '$stats.commandsUsed' } } }
            ]).then(result => result[0]?.total || 0),
            uptime: process.uptime(),
            features: {
                moderation: true,
                music: true,
                tickets: true,
                gaming: true,
                analytics: true,
                ageVerification: true,
                premium: true
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('Public stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get pricing information
router.get('/pricing', (req, res) => {
    const pricing = {
        plans: [
            {
                id: 'free',
                name: 'Free',
                price: 0,
                interval: 'forever',
                features: [
                    'Basic moderation tools',
                    'Music player',
                    'Welcome messages',
                    'Up to 3 tickets per user',
                    'Basic analytics',
                    'Community support'
                ],
                limitations: [
                    'Limited automod features',
                    'Basic ticket system',
                    'Standard support'
                ],
                popular: false
            },
            {
                id: 'basic',
                name: 'Basic',
                price: 4.99,
                interval: 'month',
                features: [
                    'Advanced moderation',
                    'Custom welcome embeds',
                    'Unlimited tickets',
                    'Reaction roles',
                    'Advanced analytics',
                    'Priority support'
                ],
                limitations: [
                    'Limited custom commands',
                    'Basic age verification'
                ],
                popular: true
            },
            {
                id: 'premium',
                name: 'Premium',
                price: 9.99,
                interval: 'month',
                features: [
                    'All Basic features',
                    'Custom commands',
                    'Advanced age verification',
                    'Gaming integration',
                    'Custom embeds',
                    'API access',
                    'Premium support'
                ],
                limitations: [],
                popular: false
            },
            {
                id: 'enterprise',
                name: 'Enterprise',
                price: 'Custom',
                interval: 'contact',
                features: [
                    'All Premium features',
                    'White-label solution',
                    'Custom integrations',
                    'Dedicated support',
                    'SLA guarantee',
                    'Custom development'
                ],
                limitations: [],
                popular: false
            }
        ],
        features: {
            moderation: {
                free: ['Basic ban/kick/mute', 'Message deletion', 'Simple automod'],
                basic: ['Advanced automod', 'Warning system', 'Temp bans/mutes'],
                premium: ['Custom punishments', 'Advanced filters', 'Smart moderation'],
                enterprise: ['White-label moderation', 'Custom rules engine']
            },
            tickets: {
                free: ['3 tickets per user', 'Basic categories', 'Text transcripts'],
                basic: ['Unlimited tickets', 'Custom categories', 'Staff assignment'],
                premium: ['Advanced routing', 'Ticket templates', 'Analytics'],
                enterprise: ['Custom workflows', 'API integration', 'SLA tracking']
            },
            analytics: {
                free: ['Basic server stats', '7-day retention'],
                basic: ['Member analytics', '30-day retention', 'Export data'],
                premium: ['Advanced metrics', '1-year retention', 'Custom reports'],
                enterprise: ['Real-time analytics', 'Unlimited retention', 'API access']
            }
        }
    };

    res.json(pricing);
});

// Get feature showcase
router.get('/features', (req, res) => {
    const features = {
        categories: [
            {
                id: 'moderation',
                name: '🛡️ Moderation & Security',
                description: 'Keep your server safe with advanced moderation tools',
                features: [
                    {
                        name: 'Auto-Moderation',
                        description: 'Automatic spam, caps, and content filtering',
                        icon: '🤖'
                    },
                    {
                        name: 'Warning System',
                        description: 'Track and manage user warnings with escalation',
                        icon: '⚠️'
                    },
                    {
                        name: 'Temporary Punishments',
                        description: 'Time-based mutes and bans with automatic removal',
                        icon: '⏰'
                    },
                    {
                        name: 'Audit Logs',
                        description: 'Complete moderation history and staff activity',
                        icon: '📋'
                    }
                ]
            },
            {
                id: 'community',
                name: '👥 Community Management',
                description: 'Build and grow your community with engagement tools',
                features: [
                    {
                        name: 'Welcome System',
                        description: 'Custom welcome messages and auto-roles',
                        icon: '👋'
                    },
                    {
                        name: 'Reaction Roles',
                        description: 'Self-assignable roles via reactions',
                        icon: '🎭'
                    },
                    {
                        name: 'Leveling System',
                        description: 'XP and level system with role rewards',
                        icon: '📈'
                    },
                    {
                        name: 'Events & Announcements',
                        description: 'Schedule events and send announcements',
                        icon: '📢'
                    }
                ]
            },
            {
                id: 'support',
                name: '🎫 Support System',
                description: 'Professional ticket system for community support',
                features: [
                    {
                        name: 'Ticket Categories',
                        description: 'Organize tickets by type and department',
                        icon: '📁'
                    },
                    {
                        name: 'Staff Assignment',
                        description: 'Automatic or manual ticket assignment',
                        icon: '👤'
                    },
                    {
                        name: 'Transcripts',
                        description: 'Complete ticket history and exports',
                        icon: '📄'
                    },
                    {
                        name: 'Feedback System',
                        description: 'Collect feedback after ticket resolution',
                        icon: '⭐'
                    }
                ]
            },
            {
                id: 'entertainment',
                name: '🎮 Entertainment',
                description: 'Keep your community engaged with fun features',
                features: [
                    {
                        name: 'Music Player',
                        description: 'High-quality music from multiple sources',
                        icon: '🎵'
                    },
                    {
                        name: 'Gaming Integration',
                        description: 'Game roles and LFG system',
                        icon: '🎮'
                    },
                    {
                        name: 'Fun Commands',
                        description: 'Games, memes, and interactive commands',
                        icon: '🎲'
                    },
                    {
                        name: 'Economy System',
                        description: 'Virtual currency and shop system',
                        icon: '💰'
                    }
                ]
            },
            {
                id: 'analytics',
                name: '📊 Analytics & Insights',
                description: 'Understand your community with detailed analytics',
                features: [
                    {
                        name: 'Server Statistics',
                        description: 'Member growth, activity, and engagement metrics',
                        icon: '📈'
                    },
                    {
                        name: 'Command Usage',
                        description: 'Track which features are most popular',
                        icon: '📊'
                    },
                    {
                        name: 'Staff Performance',
                        description: 'Monitor staff activity and response times',
                        icon: '👥'
                    },
                    {
                        name: 'Export Data',
                        description: 'Download analytics data for external analysis',
                        icon: '💾'
                    }
                ]
            },
            {
                id: 'verification',
                name: '🔞 Age Verification',
                description: 'Protect minors with comprehensive age verification',
                features: [
                    {
                        name: 'Multiple Methods',
                        description: 'Reaction, manual, or ID-based verification',
                        icon: '✅'
                    },
                    {
                        name: 'NSFW Protection',
                        description: 'Automatic channel restriction for unverified users',
                        icon: '🔒'
                    },
                    {
                        name: 'Audit Trail',
                        description: 'Complete verification logs for compliance',
                        icon: '📝'
                    },
                    {
                        name: 'Staff Tools',
                        description: 'Manual verification and override capabilities',
                        icon: '🛠️'
                    }
                ]
            }
        ]
    };

    res.json(features);
});

// Get testimonials/reviews
router.get('/testimonials', (req, res) => {
    const testimonials = [
        {
            id: 1,
            name: 'Alex Johnson',
            server: 'Gaming Community',
            avatar: 'https://i.pravatar.cc/150?img=1',
            rating: 5,
            text: 'This bot has transformed our server management. The ticket system is incredible!',
            verified: true
        },
        {
            id: 2,
            name: 'Sarah Chen',
            server: 'Art & Design Hub',
            avatar: 'https://i.pravatar.cc/150?img=2',
            rating: 5,
            text: 'The age verification system works perfectly for our 18+ content. Highly recommended!',
            verified: true
        },
        {
            id: 3,
            name: 'Mike Rodriguez',
            server: 'Tech Support',
            avatar: 'https://i.pravatar.cc/150?img=3',
            rating: 5,
            text: 'Best moderation tools I\'ve used. The auto-mod catches everything we need it to.',
            verified: true
        }
    ];

    res.json(testimonials);
});

// Get FAQ
router.get('/faq', (req, res) => {
    const faq = [
        {
            id: 1,
            category: 'General',
            question: 'What makes this bot different from others?',
            answer: 'Our bot combines professional-grade features with an intuitive web dashboard, offering everything from basic moderation to advanced age verification and payment processing.'
        },
        {
            id: 2,
            category: 'Pricing',
            question: 'Can I upgrade or downgrade my plan anytime?',
            answer: 'Yes! You can change your subscription plan anytime from the dashboard. Changes take effect immediately, and billing is prorated.'
        },
        {
            id: 3,
            category: 'Features',
            question: 'Does the free plan have any limitations?',
            answer: 'The free plan includes all basic features with some limitations like 3 tickets per user and basic analytics. Premium plans unlock advanced features and remove limitations.'
        },
        {
            id: 4,
            category: 'Privacy',
            question: 'How do you handle age verification data?',
            answer: 'We take privacy seriously. Age verification data is encrypted, stored securely, and only used for verification purposes. We comply with GDPR and other privacy regulations.'
        },
        {
            id: 5,
            category: 'Support',
            question: 'What kind of support do you offer?',
            answer: 'Free users get community support, Basic users get priority support, Premium users get priority + live chat, and Enterprise customers get dedicated support with SLA.'
        }
    ];

    res.json(faq);
});

// Get legal documents
router.get('/legal/:type', (req, res) => {
    const { type } = req.params;
    
    const documents = {
        terms: {
            title: 'Terms of Service',
            lastUpdated: '2024-01-01',
            content: 'Terms of service content would go here...'
        },
        privacy: {
            title: 'Privacy Policy',
            lastUpdated: '2024-01-01',
            content: 'Privacy policy content would go here...'
        },
        nsfw: {
            title: 'NSFW Content Policy',
            lastUpdated: '2024-01-01',
            content: 'NSFW content policy would go here...'
        }
    };

    const document = documents[type];
    if (!document) {
        return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
});

module.exports = router;