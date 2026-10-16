import { useGameStore } from './game/store'
import IntakeScreen from './components/IntakeScreen'
import HomeScreen from './components/HomeScreen'
import ConversationScreen from './components/ConversationScreen'
import ChapterConfirmScreen from './components/ChapterConfirmScreen'
import SessionCloseScreen from './components/SessionCloseScreen'

export default function App() {
  const screen = useGameStore((s) => s.screen)

  switch (screen) {
    case 'conversation':
      return <ConversationScreen />
    case 'chapterConfirm':
      return <ChapterConfirmScreen />
    case 'sessionClose':
      return <SessionCloseScreen />
    case 'home':
      return <HomeScreen />
    case 'intake':
    default:
      return <IntakeScreen />
  }
}
