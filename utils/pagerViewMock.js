// Mock dla react-native-pager-view na platformie webowej
// PagerView nie działa na webie, więc zwracamy pustą implementację
// Ten mock zapobiega błędom podczas inicjalizacji na webie

import React from 'react';
import { View } from 'react-native';

// Mock komponent PagerView
const PagerViewMock = React.forwardRef((props, ref) => {
  const { children, initialPage = 0, onPageSelected, style, scrollEnabled } = props;
  const [currentPage, setCurrentPage] = React.useState(initialPage);

  // Aktualizuj stronę gdy zmienia się initialPage
  React.useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  // Eksponuj metody potrzebne przez ref
  React.useImperativeHandle(ref, () => ({
    setPage: (pageIndex) => {
      if (pageIndex >= 0 && pageIndex < React.Children.count(children)) {
        setCurrentPage(pageIndex);
        if (onPageSelected) {
          onPageSelected({
            nativeEvent: { position: pageIndex },
          });
        }
      }
    },
  }), [children, onPageSelected]);

  // Renderuj tylko aktualną stronę (dla kompatybilności z kodem mobilnym)
  const childrenArray = React.Children.toArray(children);
  const currentChild = childrenArray[currentPage] || null;

  return (
    <View style={style}>
      {currentChild}
    </View>
  );
});

PagerViewMock.displayName = 'PagerView';

export default PagerViewMock;

