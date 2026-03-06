const fs = require('fs');

const file = 'src/app/quran-reciter.tsx';
let content = fs.readFileSync(file, 'utf-8');

// Header
content = content.replace(/<SafeAreaView>/, '<SafeAreaView style={styles.safeArea}>');
content = content.replace(/<View>\\s*<TouchableOpacity onPress=\{\(\) => router\.back\(\)\}>/g, '<View style={styles.headerContainer}>\n                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>');
content = content.replace(/<ChevronLeft size=\{20\} color="#047857" \/>\\s*<Text>Back<\/Text>/g, '<ChevronLeft size={20} color="#047857" />\n                    <Text style={styles.backText}>Back</Text>');
content = content.replace(/<View>\\s*<Text>\\s*Surat \{currentSurah/g, '<View style={styles.titleContainer}>\n                    <Text style={styles.titleText}>\n                        Surat {currentSurah');
content = content.replace(/<Text>\\s*Ayah \{currentAyahNumber/g, '<Text style={styles.subtitleText}>\n                        Ayah {currentAyahNumber');
content = content.replace(/<View>\\s*<TouchableOpacity onPress=\{\(\) => \{ setActiveTab\('surahs'\); setShowSurahList\(true\); \}\}>\\s*<Text>Surah List/g, '<View style={styles.rightActionContainer}>\n                    <TouchableOpacity onPress={() => { setActiveTab(\\'surahs\\'); setShowSurahList(true); }}>\n                        <Text style={styles.surahListText}>Surah List');
content = content.replace(/<TouchableOpacity\\s*onPress=\{toggleBookmark\}\\s*>/, '<TouchableOpacity\n                onPress={toggleBookmark}\n                style={styles.bookmarkRibbonPosition}\n            >');
content = content.replace(/<View>\\s*<Bookmark size=\{20\}/, '<View style={[styles.bookmarkRibbon, isCurrentAyahBookmarked ? styles.bookmarkRibbonActive : styles.bookmarkRibbonInactive]}>\n                    <Bookmark size={20}');

// ScrollView Main
content = content.replace(/<ScrollView>\\s*\{loading \?/g, '<ScrollView style={styles.scrollViewContainer}>\n                {loading ?');
content = content.replace(/<View>\\s*<Text>Loading Verse\.\.\.<\/Text>\\s*<\/View>/g, '<View style={styles.loadingContainer}>\n                        <Text style={styles.loadingText}>Loading Verse...</Text>\n                    </View>');
content = content.replace(/<View>\\s*<Text>\\s*\{currentSurah\?\.englishName\} • Verse \{currentAyahNumber\}\\s*<\/Text>/g, '<View style={styles.contentContainer}>\n                        <Text style={styles.bismillahText}>\n                            {currentSurah?.englishName} • Verse {currentAyahNumber}\n                        </Text>');
content = content.replace(/<Text>\\s*\{currentSurah\?\.englishNameTranslation\}\\s*<\/Text>/g, '<Text style={styles.bismillahEnglishText}>\n                            {currentSurah?.englishNameTranslation}\n                        </Text>');

// Arabic Flow
content = content.replace(/<View>\\s*\{highlightWords && ayahData\?\.words \?/g, '<View style={[styles.arabicTextContainer, hideArabic ? styles.opacity20 : null]}>\n                            {highlightWords && ayahData?.words ?');
content = content.replace(/<TouchableOpacity\\s*key=\{word\.id\}\\s*onPress=\{\(\) => seekToWord\(word\.position\)\}\\s*>/g, '<TouchableOpacity\n                                            key={word.id}\n                                            onPress={() => seekToWord(word.position)}\n                                            style={[styles.wordButton, isCurrent ? styles.wordButtonActive : null]}\n                                        >');
content = content.replace(/<Text>\\s*\{word\.text\}\\s*<\/Text>/g, '<Text style={[styles.arabicWordText, isCurrent ? styles.arabicWordTextActive : styles.arabicWordTextInactive]}>\n                                                {word.text}\n                                            </Text>');
content = content.replace(/<Text>\\s*\{ayahData\?\.text\}\\s*<\/Text>/g, '<Text style={styles.arabicFullText}>\n                                    {ayahData?.text}\n                                </Text>');

// Transliteration & Translation
content = content.replace(/<Text>\\s*\{ayahData\?\.transliteration\}\\s*<\/Text>/g, '<Text style={styles.transliterationText}>\n                                {ayahData?.transliteration}\n                            </Text>');
content = content.replace(/<View \/>\\s*\{\/\* Translation \*\/\}/g, '<View style={styles.divider} />\n\n                        {/* Translation */}');
content = content.replace(/<Text>\\s*\{ayahData\?\.translation\}\\s*<\/Text>/g, '<Text style={styles.translationText}>\n                                {ayahData?.translation}\n                            </Text>');

// Dock Content fixes
content = content.replace(/<View>\\s*<TouchableOpacity\\s*onPress=\{handleNext\}\\s*>/g, '<View style={styles.nextSurahPillContainer}>\n                    <TouchableOpacity \n                        onPress={handleNext}\n                        style={styles.nextSurahPillButton}\n                    >');
content = content.replace(/<Text>\\s*View next surah:/g, '<Text style={styles.nextSurahPillText}>\n                            View next surah:');
content = content.replace(/<View>\\s*<TouchableOpacity onPress=\{\(\) => \{ setActiveTab\('history'\)/g, '<View style={styles.dockContainer}>\n                <TouchableOpacity style={styles.dockItem} onPress={() => { setActiveTab(\\'history\\')');
content = content.replace(/<History size=\{24\} color="#666" \/>\\s*<Text>Stay<\/Text>/g, '<History size={24} color="#666" />\n                    <Text style={styles.dockItemText}>Stay</Text>');
content = content.replace(/<TouchableOpacity onPress=\{\(\) => setShowSettingsMenu\(true\)\}>\\s*<Text>Aa<\/Text>/g, '<TouchableOpacity style={styles.dockItem} onPress={() => setShowSettingsMenu(true)}>\n                    <Text style={styles.dockAaText}>Aa</Text>');
content = content.replace(/<Text>Icon<\/Text>/g, '<Text style={styles.dockItemText}>Icon</Text>');
content = content.replace(/<View>\\s*<TouchableOpacity\\s*onPress=\{togglePlay\}\\s*disabled=\{loading\}\\s*>/g, '<View style={styles.dockPlayButtonContainer}>\n                    <TouchableOpacity\n                        onPress={togglePlay}\n                        disabled={loading}\n                        style={styles.dockPlayButton}\n                    >');
content = content.replace(/\{isPlaying \? <Pause size=\{30\} color="white" \/> : <Play size=\{30\} color="white" \/>\}/g, '{isPlaying ? <Pause size={30} color="white" /> : <Play size={30} color="white" style={styles.dockPlayIcon} />}');
content = content.replace(/<Settings size=\{24\} color="#666" \/>\\s*<Text>Settings<\/Text>/g, '<Settings size={24} color="#666" />\n                    <Text style={styles.dockItemText}>Settings</Text>');
content = content.replace(/<User size=\{24\} color="#666" \/>\\s*<Text>Modes<\/Text>/g, '<User size={24} color="#666" />\n                    <Text style={styles.dockItemText}>Modes</Text>');
content = content.replace(/<TouchableOpacity onPress=\{\(\) => setShowSettingsMenu\(true\)\}>\\s*<Settings/g, '<TouchableOpacity style={styles.dockItem} onPress={() => setShowSettingsMenu(true)}>\n                    <Settings');
content = content.replace(/<TouchableOpacity onPress=\{\(\) => \{ \}\}>\\s*<User/g, '<TouchableOpacity style={styles.dockItem} onPress={() => { }}>\n                    <User');


// Adding Styles
if (!content.includes('StyleSheet.create')) {
    content = content.replace(/import \{ Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View \} from 'react-native';/, "import { Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';");

    const stylesString = `

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FDFCFB',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: 'white',
        zIndex: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backText: {
        color: '#047857',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    titleContainer: {
        flex: 2,
        alignItems: 'center',
    },
    titleText: {
        color: '#292524',
        fontWeight: 'bold',
        fontSize: 18,
    },
    subtitleText: {
        color: '#a8a29e',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 2,
    },
    rightActionContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    surahListText: {
        color: '#57534e',
        fontWeight: '500',
    },
    // Ribbon
    bookmarkRibbonPosition: {
        position: 'absolute',
        top: 16,
        right: 32,
        zIndex: 20,
    },
    bookmarkRibbon: {
        width: 32,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 6,
        borderBottomRightRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    bookmarkRibbonActive: {
        backgroundColor: '#d97706',
    },
    bookmarkRibbonInactive: {
        backgroundColor: '#fcd34d',
    },
    // Main Content
    scrollViewContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
    },
    loadingText: {
        color: '#a8a29e',
    },
    contentContainer: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    bismillahText: {
        color: '#059669',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontSize: 12,
        marginBottom: 4,
    },
    bismillahEnglishText: {
        color: '#a8a29e',
        fontSize: 12,
        fontStyle: 'italic',
        marginBottom: 32,
    },
    arabicTextContainer: {
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 40,
    },
    opacity20: {
        opacity: 0.2,
    },
    wordButton: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 8,
    },
    wordButtonActive: {
        backgroundColor: '#e6f4ea',
    },
    arabicWordText: {
        fontSize: 32,
        lineHeight: 60,
        textAlign: 'right',
        fontWeight: '500',
    },
    arabicWordTextActive: {
        color: '#047a55',
    },
    arabicWordTextInactive: {
        color: '#292524',
    },
    arabicFullText: {
        fontSize: 32,
        lineHeight: 60,
        textAlign: 'center',
        color: '#292524',
        fontWeight: '500',
    },
    transliterationText: {
        color: '#047857',
        fontSize: 20,
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: 24,
        paddingHorizontal: 16,
        lineHeight: 32,
    },
    divider: {
        height: 1,
        width: 64,
        backgroundColor: '#e7e5e4',
        marginBottom: 24,
    },
    translationText: {
        color: '#44403c',
        fontSize: 18,
        textAlign: 'center',
        fontWeight: '300',
        lineHeight: 28,
        paddingHorizontal: 8,
    },
    // Dock Hub
    nextSurahPillContainer: {
        position: 'absolute',
        bottom: 110,
        alignSelf: 'center',
        zIndex: 40,
    },
    nextSurahPillButton: {
        backgroundColor: '#e6f4ea',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1fae5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    nextSurahPillText: {
        color: '#047857',
        fontWeight: '500',
        marginRight: 8,
    },
    dockContainer: {
        position: 'absolute',
        bottom: 32,
        alignSelf: 'center',
        width: '90%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 30,
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
        borderColor: '#f5f5f4',
        borderWidth: 1,
        zIndex: 50,
    },
    dockItem: {
        alignItems: 'center',
    },
    dockItemText: {
        fontSize: 10,
        color: '#78716c',
        fontWeight: '500',
        marginTop: 4,
    },
    dockAaText: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#57534e',
        lineHeight: 24,
    },
    dockPlayButtonContainer: {
        alignItems: 'center',
        marginTop: -24,
    },
    dockPlayButton: {
        width: 64,
        height: 64,
        backgroundColor: '#059669',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 3,
        borderColor: '#FDFCFB',
    },
    dockPlayIcon: {
        marginLeft: 4,
    },
});
`;
    content = content.replace(/\\n\}$/, '\\n}' + stylesString);
}


fs.writeFileSync(file, content);
