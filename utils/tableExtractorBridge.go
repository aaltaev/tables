package utils

import "os/exec"

func ExtractTable(filename string, parameters string) error {
	_, err := exec.Command(
		"java", "-jar",
		"./extractor/cells_project.jar",
		"./upload/" + filename,
		parameters).CombinedOutput()
	if err != nil {
		return err
	}
	return nil
}
