import os

file_path = "src/app/quran-reciter.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "import { Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';",
    "import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
