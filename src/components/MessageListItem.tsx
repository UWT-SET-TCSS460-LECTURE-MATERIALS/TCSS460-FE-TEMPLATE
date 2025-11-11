import { useRouter } from 'next/navigation';

import DeleteIcon from '@mui/icons-material/Delete';
import CommentsDisabledIcon from '@mui/icons-material/CommentsDisabled';
import { IconButton, ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';

// project import
import { IMessage } from 'types/message';
import PriorityAvatar from 'components/Priority';
import { useMessage } from 'contexts/MessageContext';

export function MessageListItem({ message, onDelete }: { message: IMessage; onDelete: (name: string) => void }) {
  const router = useRouter();
  const { onChangeMessage } = useMessage();

  // function onItemClick(msg: IMessage) {
  //   console.dir(msg);
  // }

  // function onItemClick({ name }: IMessage) {
  //   router.push('/messages/msgParam/' + name);
  // }

  // function onItemClick(msg: IMessage) {
  //   router.push('/messages/msgQuery?msg=' + JSON.stringify(msg));
  // }

  function onItemClick(msg: IMessage) {
    onChangeMessage(msg);
    router.push('/messages/msgContext/');
  }

  return (
    <ListItem
      secondaryAction={
        <IconButton edge="end" aria-label="delete" onClick={() => onDelete(message.name)}>
          <DeleteIcon />
        </IconButton>
      }
      disablePadding
    >
      <ListItemButton onClick={() => onItemClick(message)}>
        <ListItemAvatar>
          <PriorityAvatar priority={message.priority} />
        </ListItemAvatar>
        <ListItemText
          primary={message.message}
          secondary={message.name}
          slotProps={{
            secondary: { color: 'gray' }
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}

export function NoMessage() {
  return (
    <ListItem>
      <ListItemAvatar>
        <CommentsDisabledIcon />
      </ListItemAvatar>
      <ListItemText primary="No Elements" />
    </ListItem>
  );
}
