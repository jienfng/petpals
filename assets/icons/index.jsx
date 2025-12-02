// assets/icons/index.jsx
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

// Map your app's icon names to Feather icon names
const map = {
  arrowLeft: 'arrow-left',
  call: 'phone',
  camera: 'camera',
  comment: 'message-circle',
  delete: 'trash-2',
  edit: 'edit-2',
  heart: 'heart',
  home: 'home',
  image: 'image',
  location: 'map-pin',
  lock: 'lock',
  logout: 'log-out',
  mail: 'mail',
  plus: 'plus-square',
  search: 'search',
  send: 'send',
  share: 'share-2',
  threeDotsCircle: 'more-horizontal',     // Feather doesn't have a circled version
  threeDotsHorizontal: 'more-horizontal',
  user: 'user',
  video: 'video',
};

export default function Icon({
  name,
  size = 24,
  color = theme?.colors?.textLight ?? '#000',
  ...props
}) {
  const featherName = map[name] ?? name; // fallback: allow raw Feather names
  return <Feather name={featherName} size={size} color={color} {...props} />;
}
