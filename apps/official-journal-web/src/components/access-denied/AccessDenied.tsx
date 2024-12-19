import { Box, Button, ProblemTemplate } from '@island.is/island-ui/core'

import { useLogOut } from '../../hooks/useLogOut'

export const AccessDenied = () => {
  const logOut = useLogOut()
  return (
    <Box>
      <ProblemTemplate
        variant="error"
        showIcon
        title="Aðgangur bannaður"
        message="Þú ert ekki með aðgang að þessu svæði, ef þú telur að þú ættir að hafa aðgang, vinsamlegast hafðu samband við ritstjórn."
      />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        marginTop={2}
      >
        <Button
          colorScheme="destructive"
          size="medium"
          variant="ghost"
          onClick={logOut}
        >
          Skrá út
        </Button>
      </Box>
    </Box>
  )
}
