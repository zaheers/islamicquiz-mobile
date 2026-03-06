const fs = require('fs');
const filePath = 'src/app/quran-reciter.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// The new return block
const newReturnBlock = `    const progressPercent = currentSurah ? (currentAyahNumber / currentSurah.numberOfAyahs) * 100 : 0;

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
                                onPress={() => setActiveTab(tab as any)}
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
    );`;

const returnBlockRegex = /    return \([\s\S]*?<\/SafeAreaView>\r?\n    \);\r?\n}/;
let newC = content.replace(returnBlockRegex, newReturnBlock + '\n}');
fs.writeFileSync(filePath, newC);
console.log('Successfully replaced JSX return block');
