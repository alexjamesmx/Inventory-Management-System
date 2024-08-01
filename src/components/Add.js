// components/Add.js
import React, { useState } from "react";
import { Button } from "@mui/material";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import { ModalForm } from "@/components/ModalForm";

export function Add({ items }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Button
        variant={"contained"}
        color={"primary"}
        endIcon={<AddAPhotoIcon />}
        style={{ marginBottom: 20 }}
        onClick={handleOpen}
      >
        Add
      </Button>
      <ModalForm open={open} handleClose={handleClose} items />
    </>
  );
}
