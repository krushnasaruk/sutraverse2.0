const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /@\/context/g, to: '@/frontend/context' },
    { from: /@\/lib\/firebase/g, to: '@/database/config/firebase' },
    { from: /@\/lib\/firebaseAdmin/g, to: '@/database/config/firebaseAdmin' },
    { from: /@\/lib\/points/g, to: '@/database/queries/points' },
    { from: /@\/lib\/sppuGrading/g, to: '@/shared/utils/sppuGrading' },
    { from: /@\/lib\/uploadsDir/g, to: '@/shared/utils/uploadsDir' },
    { from: /@\/lib\/subjectMap/g, to: '@/shared/constants/subjectMap' },
    { from: /@\/lib\/bannerPresets/g, to: '@/shared/constants/bannerPresets' },

    { from: /@\/components\/Animations/g, to: '@/frontend/components/ui/Animations' },
    { from: /@\/components\/ConfettiExplosion/g, to: '@/frontend/components/ui/ConfettiExplosion' },
    { from: /@\/components\/Icons/g, to: '@/frontend/components/ui/Icons' },
    { from: /@\/components\/Skeleton/g, to: '@/frontend/components/ui/Skeleton' },
    { from: /@\/components\/SkeletonCard/g, to: '@/frontend/components/ui/SkeletonCard' },

    { from: /@\/components\/Navbar/g, to: '@/frontend/components/layout/Navbar' },
    { from: /@\/components\/MobileNav/g, to: '@/frontend/components/layout/MobileNav' },
    { from: /@\/components\/AnnouncementBanner/g, to: '@/frontend/components/layout/AnnouncementBanner' },

    { from: /@\/components\/MaintenanceGuard/g, to: '@/frontend/components/core/MaintenanceGuard' },
    { from: /@\/components\/CookieConsent/g, to: '@/frontend/components/core/CookieConsent' },
    { from: /@\/components\/CustomCursor/g, to: '@/frontend/components/core/CustomCursor' },

    { from: /@\/components\/GlobalBot/g, to: '@/frontend/components/features/GlobalBot' },
    { from: /@\/components\/GlobalEngagements/g, to: '@/frontend/components/features/GlobalEngagements' },
    { from: /@\/components\/AdUnit/g, to: '@/frontend/components/features/AdUnit' },
    
    // Fallback for any leftover generic imports (very rare, but just in case)
    { from: /from ['"]@\/components['"]/g, to: 'from \'@/frontend/components\'' },
];

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Ignore node_modules, .next, .git
            if (['node_modules', '.next', '.git', 'deployment'].includes(file)) continue;
            processDirectory(fullPath);
        } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(file)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            for (const { from, to } of replacements) {
                if (from.test(content)) {
                    content = content.replace(from, to);
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated imports in: ${fullPath}`);
            }
        }
    }
}

// Start processing from src/
processDirectory(path.join(process.cwd(), 'src'));
console.log('Import refactoring complete!');
