import { useGameStore } from './game/store'
import WelcomeScreen from './components/WelcomeScreen'
import NameScreen from './components/NameScreen'
import FirstChoiceScreen from './components/FirstChoiceScreen'
import HomeScreen from './components/HomeScreen'
import ConversationEntryScreen from './components/ConversationEntryScreen'
import CategoryBrowserScreen from './components/CategoryBrowserScreen'
import MemoryActivityScreen from './components/MemoryActivityScreen'
import ConversationScreen from './components/ConversationScreen'
import ChapterConfirmScreen from './components/ChapterConfirmScreen'
import SessionCloseScreen from './components/SessionCloseScreen'
import LibraryScreen from './components/LibraryScreen'
import FamilyTreeScreen from './components/FamilyTreeScreen'

export default function App() {
  const screen = useGameStore((s) => s.screen)

  switch (screen) {
    case 'conversation':
      return <ConversationScreen />
    case 'chapterConfirm':
      return <ChapterConfirmScreen />
    case 'sessionClose':
      return <SessionCloseScreen />
    case 'library':
      return <LibraryScreen />
    case 'familyTree':
      return <FamilyTreeScreen />
    case 'conversationEntry':
      return <ConversationEntryScreen />
    case 'categoryBrowser':
      return <CategoryBrowserScreen />
    case 'memoryActivity':
      return <MemoryActivityScreen />
    case 'home':
      return <HomeScreen />
    case 'firstChoice':
      return <FirstChoiceScreen />
    case 'name':
      return <NameScreen />
    case 'welcome':
    default:
      return <WelcomeScreen />
  }
}
