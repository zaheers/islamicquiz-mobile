const fs = require('fs');

const content = fs.readFileSync('src/app/quran-reciter.tsx', 'utf-8');

// Match everything up to the declaration of `filteredSurahs`
const splitIdx = content.indexOf('    const filteredSurahs =');
let p1 = '';
if (splitIdx !== -1) {
    p1 = content.substring(0, splitIdx);
} else {
    console.error("Could not find filteredSurahs in file.");
    process.exit(1);
}

const newReturnBlock = `    const filteredSurahs = surahs.filter(s =>
        s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.number.toString().includes(searchQuery)
    );

    const progressPercent = currentSurah ? (currentAyahNumber / currentSurah.numberOfAyahs) * 100 : 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header Section */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIconButton}>
                    <ChevronLeft size={24} color="#57534e" />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>
                        {currentSurah?.englishName || 'Loading...'}
                    </Text>
                    <Text style={styles.subtitleText}>
                        Ayah {currentAyahNumber} of {currentSurah?.numberOfAyahs || 0}
                    </Text>
                </View>

                <TouchableOpacity onPress={() => { setActiveTab('surahs'); setShowSurahList(true); }} style={styles.headerIconButton}>
                    <History size={20} color="#57534e" />
                </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: \`\${progressPercent}%\` }]} />
            </View>

            {/* Content Section */}
            <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.scrollContentLayout} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading Verse...</Text>
                    </View>
                ) : (
                    <View style={styles.contentContainer}>
                        {/* Arabic Section */}
                        <View style={[styles.arabicTextContainer, hideArabic ? styles.hiddenText : null]}>
                            {highlightWords && ayahData?.words ? (
                                ayahData.words.map((word) => {
                                    const isCurrent = currentWordIndex === word.position;
                                    return (
                                        <TouchableOpacity
                                            key={word.id}
                                            onPress={() => seekToWord(word.position)}
                                            style={[styles.wordButton, isCurrent ? styles.wordButtonActive : null]}
                                        >
                                            <Text style={[styles.arabicWordText, isCurrent ? styles.arabicWordTextActive : null]}>
                                                {word.text}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <Text style={styles.arabicFullText}>
                                    {ayahData?.text}
                                </Text>
                            )}
                        </View>

                        {/* Transliteration Section */}
                        {!hideTransliteration && (
                            <View style={styles.transliterationContainer}>
                                <Text style={styles.transliterationText}>
                                    {ayahData?.transliteration}
                                </Text>
                            </View>
                        )}

                        {/* Translation Section */}
                        {!hideTranslation && (
                            <View style={styles.translationContainer}>
                                <Text style={styles.translationText}>
                                    {ayahData?.translation}
                                </Text>
                            </View>
                        )}
                        
                        {/* Extra spacer for dock */}
                        <View style={{height: 120}} />
                    </View>
                )}
            </ScrollView>

            {/* Floating Bookmarker */}
            <TouchableOpacity
                onPress={toggleBookmark}
                style={styles.floatingBookmark}
            >
                <Bookmark size={22} color={isCurrentAyahBookmarked ? "#059669" : "#a8a29e"} fill={isCurrentAyahBookmarked ? "#059669" : "none"} />
            </TouchableOpacity>

            {/* Floating Control Dock */}
            <View style={styles.dockWrapper}>
                <View style={styles.dockContainer}>
                    {/* Toggles */}
                    <View style={styles.dockToggles}>
                        <TouchableOpacity style={[styles.dockToggleBtn, !hideArabic && styles.dockToggleBtnActive]} onPress={() => setHideArabic(!hideArabic)}>
                            <BookOpen size={20} color={!hideArabic ? '#059669' : '#a8a29e'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.dockToggleBtn, !hideTransliteration && styles.dockToggleBtnActive]} onPress={() => setHideTransliteration(!hideTransliteration)}>
                            <Type size={20} color={!hideTransliteration ? '#059669' : '#a8a29e'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.dockToggleBtn, !hideTranslation && styles.dockToggleBtnActive]} onPress={() => setHideTranslation(!hideTranslation)}>
                            <Languages size={20} color={!hideTranslation ? '#059669' : '#a8a29e'} />
                        </TouchableOpacity>
                    </View>

                    {/* Media Controls */}
                    <View style={styles.dockMediaControls}>
                        <TouchableOpacity style={styles.dockMediaBtn} onPress={handlePrevious}>
                            <SkipBack size={24} color="#57534e" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={togglePlay}
                            disabled={loading}
                            style={styles.dockPlayButton}
                        >
                            {isPlaying ? <Pause size={28} color="white" fill="white" /> : <Play size={28} color="white" fill="white" style={styles.dockPlayIcon} />}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.dockMediaBtn} onPress={handleNext}>
                            <SkipForward size={24} color="#57534e" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Lists Modal */}
            <Modal visible={showSurahList} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSurahList(false)}>
                <SafeAreaView style={styles.surahListSafeArea}>
                    <View style={styles.surahListTabsContainer}>
                        {['surahs', 'bookmarks', 'history'].map(tab => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                style={[styles.surahListTab, activeTab === tab ? styles.surahListTabActive : styles.surahListTabInactive]}
                            >
                                <Text style={[styles.surahListTabText, activeTab === tab ? styles.surahListTabTextActive : styles.surahListTabTextInactive]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.surahListContent}>
                        {activeTab === 'surahs' && (
                            <>
                                <View style={styles.surahListHeader}>
                                    <TextInput
                                        placeholder="Search Surah..."
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        style={styles.surahListSearchInput}
                                        placeholderTextColor="#a8a29e"
                                    />
                                </View>
                                <ScrollView style={styles.surahListContent}>
                                    {filteredSurahs.map(surah => (
                                        <TouchableOpacity
                                            key={surah.number}
                                            onPress={() => { setCurrentSurah(surah); setCurrentAyahNumber(1); setShowSurahList(false); }}
                                            style={styles.surahListItem}
                                        >
                                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                <View style={styles.surahListNumberContainer}>
                                                    <Text style={styles.surahListNumber}>{surah.number}</Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.surahListEnglishName}>{surah.englishName}</Text>
                                                    <Text style={styles.surahListTranslation}>{surah.revelationType}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.surahListArabicName}>{surah.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}

                        {activeTab === 'bookmarks' && (
                            <ScrollView style={styles.surahListContent}>
                                {bookmarks.map((entry) => (
                                    <TouchableOpacity
                                        key={\`\${entry.surahNumber}-\${entry.ayahNumber}\`}
                                        onPress={() => {
                                            const surah = surahs.find(s => s.number === entry.surahNumber);
                                            if (surah) { setCurrentSurah(surah); setCurrentAyahNumber(entry.ayahNumber); setShowSurahList(false); }
                                        }}
                                        style={styles.surahListItem}
                                    >
                                        <View>
                                            <Text style={{fontWeight: '600', color: '#047857'}}>{entry.surahName} - Verse {entry.ayahNumber}</Text>
                                            <Text style={{color: '#78716c', marginTop: 4}} numberOfLines={1}>{entry.previewText}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {activeTab === 'history' && (
                            <ScrollView style={styles.surahListContent}>
                                {history.map((entry, i) => (
                                    <TouchableOpacity
                                        key={\`\${entry.surahNumber}-\${entry.ayahNumber}-\${i}\`}
                                        onPress={() => {
                                            const surah = surahs.find(s => s.number === entry.surahNumber);
                                            if (surah) { setCurrentSurah(surah); setCurrentAyahNumber(entry.ayahNumber); setShowSurahList(false); }
                                        }}
                                        style={styles.surahListItem}
                                    >
                                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            <History size={18} color="#059669" style={{marginRight: 12}} />
                                            <View>
                                                <Text style={{fontWeight: '600', color: '#292524'}}>{entry.surahName}</Text>
                                                <Text style={{fontSize: 10, color: '#a8a29e'}}>Verse {entry.ayahNumber}</Text>
                                            </View>
                                        </View>
                                        <Text style={{fontSize: 10, color: '#a8a29e', textTransform: 'uppercase'}}>{new Date(entry.timestamp).toLocaleDateString()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowSurahList(false)}
                        style={{margin: 16, backgroundColor: '#e5e5e5', padding: 16, borderRadius: 12, alignItems: 'center'}}
                    >
                        <Text style={{fontWeight: 'bold', color: '#57534e', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12}}>Close</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFAF9' },

    // Header Structure
    headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#FAFAF9', zIndex: 10 },
    headerIconButton: { padding: 8, borderRadius: 12, backgroundColor: '#f5f5f4' },
    titleContainer: { flex: 1, alignItems: 'center' },
    titleText: { color: '#292524', fontWeight: '800', fontSize: 18, letterSpacing: 0.5 },
    subtitleText: { color: '#a8a29e', fontSize: 13, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },

    // Progress
    progressTrack: { height: 2, backgroundColor: '#f5f5f4', width: '100%' },
    progressBar: { height: 2, backgroundColor: '#059669' },

    // Layout
    scrollViewContainer: { flex: 1 },
    scrollContentLayout: { paddingHorizontal: 24, paddingVertical: 40 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 120 },
    loadingText: { color: '#a8a29e', fontSize: 16 },
    contentContainer: { alignItems: 'center', width: '100%' },

    // Arabic Section (Primary Focus)
    arabicTextContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24, width: '100%' },
    hiddenText: { opacity: 0.1 },
    wordButton: { paddingHorizontal: 4, paddingVertical: 4, borderRadius: 8 },
    wordButtonActive: { backgroundColor: '#d1fae5' },
    arabicWordText: { fontSize: 44, lineHeight: 76, textAlign: 'right', fontWeight: '500', color: '#1c1917' },
    arabicWordTextActive: { color: '#047857' },
    arabicFullText: { fontSize: 44, lineHeight: 76, textAlign: 'center', color: '#1c1917', fontWeight: '500' },

    // Transliteration Section
    transliterationContainer: { width: '100%', marginBottom: 32, paddingHorizontal: 8 },
    transliterationText: { color: '#047857', fontSize: 20, textAlign: 'center', fontWeight: '500', lineHeight: 32 },

    // Translation Section
    translationContainer: { width: '100%', marginTop: 8, borderTopWidth: 1, borderTopColor: '#f5f5f4', paddingTop: 32 },
    translationText: { color: '#44403c', fontSize: 18, textAlign: 'left', fontWeight: '400', lineHeight: 30 },

    // Top Right Ribbon
    floatingBookmark: { position: 'absolute', top: 84, right: 24, zIndex: 20, backgroundColor: 'white', padding: 12, borderRadius: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },

    // Bottom Control Dock
    dockWrapper: { position: 'absolute', bottom: 32, width: '100%', alignItems: 'center', zIndex: 50 },
    dockContainer: { width: '92%', backgroundColor: '#ffffff', borderRadius: 28, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 12, borderWidth: 1, borderColor: '#f5f5f4' },
    
    // Toggles inside Dock
    dockToggles: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    dockToggleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' },
    dockToggleBtnActive: { backgroundColor: '#d1fae5' },

    // Media Controls inside Dock
    dockMediaControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dockMediaBtn: { padding: 8 },
    dockPlayButton: { width: 56, height: 56, backgroundColor: '#059669', borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
    dockPlayIcon: { marginLeft: 4 },

    // Surah List Modal
    surahListSafeArea: { flex: 1, backgroundColor: 'white' },
    surahListHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
    surahListSearchInput: { backgroundColor: '#f5f5f4', padding: 12, borderRadius: 8, fontSize: 16 },
    surahListTabsContainer: { flexDirection: 'row', padding: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: '#e7e5e4' },
    surahListTab: { flex: 1, paddingVertical: 8, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
    surahListTabActive: { backgroundColor: '#059669' },
    surahListTabInactive: { backgroundColor: '#f5f5f4' },
    surahListTabText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5 },
    surahListTabTextActive: { color: 'white' },
    surahListTabTextInactive: { color: '#78716c' },
    surahListContent: { flex: 1, padding: 16 },
    surahListItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f4', alignItems: 'center', backgroundColor: '#fafaf9', borderRadius: 16, marginBottom: 8, justifyContent: 'space-between' },
    surahListNumberContainer: { width: 32, height: 32, backgroundColor: '#fff', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#e5e5e5' },
    surahListNumber: { color: '#57534e', fontWeight: 'bold', fontSize: 12 },
    surahListEnglishName: { fontWeight: '600', color: '#292524', fontSize: 16 },
    surahListTranslation: { color: '#a8a29e', fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1.5 },
    surahListArabicName: { color: '#78716c', fontWeight: '600', fontSize: 20 }
});
`;

fs.writeFileSync('src/app/quran-reciter.tsx', p1 + newReturnBlock);
console.log('Fully reconstructed quran-reciter.tsx!');
