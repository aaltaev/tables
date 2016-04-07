package utils

import (
	"sort"
	"strconv"
	"strings"
)

func DoSort(strings, prefixes []string) []string {
	toSort := SortInterfaceImpl{strings, prefixes}
	sort.Sort(toSort)
	return toSort.strings
}

type SortInterfaceImpl struct {
	//string slice to sort
	strings  []string
	//slice of prefixes to ignore when sort
	prefixes []string
}

func (s SortInterfaceImpl) Len() int {
	return len(s.strings)
}

func (s SortInterfaceImpl) Less(i, j int) bool {
	a, _ := strconv.Atoi(removePrefixes(s.strings[i], s.prefixes...))
	b, _ := strconv.Atoi(removePrefixes(s.strings[j], s.prefixes...))
	return a < b
}

func (s SortInterfaceImpl) Swap(i, j int) {
	s.strings[i], s.strings[j] = s.strings[j], s.strings[i]
}

func removePrefixes(s string, prefixes... string) string {
	for _, v := range prefixes {
		s = strings.Replace(s, v, "", -1)
	}
	return s
}
