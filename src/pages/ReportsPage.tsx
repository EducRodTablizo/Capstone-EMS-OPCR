import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material'
import ConstructionIcon from '@mui/icons-material/Construction'

export default function ReportsPage() {
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()

  const handleClose = () => {
    setOpen(false)
    navigate('/dashboard')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: '16px', p: 3, textAlign: 'center' }
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 1 }}>
          <ConstructionIcon sx={{ fontSize: 48, color: '#BA7517' }} />
          <DialogTitle sx={{ p: 0, fontWeight: 700, fontSize: '20px', color: '#580000' }}>
            Feature Under Development
          </DialogTitle>
        </Box>
        <DialogContent sx={{ p: 0, mt: 2, mb: 3 }}>
          <Typography sx={{ fontSize: '14px', color: 'text.secondary', lineHeight: 1.5 }}>
            This feature is not yet assigned for the current sprint and is currently under development.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 0, justifyContent: 'center' }}>
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{
              bgcolor: '#580000',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              px: 4,
              '&:hover': { bgcolor: '#7a0c0c' }
            }}
          >
            Back to Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
