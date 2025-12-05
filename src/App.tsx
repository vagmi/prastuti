import { useEffect } from "react";
import EditorLayout from "./features/editor/components/layout/EditorLayout";
import { preloadCuratedFonts } from "./features/editor/services/googleFonts";

function App() {
  useEffect(() => {
    // Preload Google Fonts on app initialization
    preloadCuratedFonts();
  }, []);

  return <EditorLayout />;
}

export default App;
