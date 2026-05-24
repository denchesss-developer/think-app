import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAABeElEQVR4AbSTPS8EURSG71AoFRqFQoSISDQUQkRQConCLxAh0SmIj0KJQi2UShKJH0AkiIIoFMJPUChUVLvPO7t3c/buJjM7O7t5n3Pu5zvn7p1pcy34edNJvLchF3lTmW0p5IE1PcYwl2qt6QOmUtPG1lSGR4QRUNWkbLKme1jowkjumXAGekjDlVvTe0we4QakDkIE+/ADv6A5PcSjIiwscc6axgOECF7gGs5hFVbgBNphFnZgF+xD6JZkTacZ0ms1SF6DJZDhAnkDNDdO/od56IQuWCyjU9J0VZXq+LqgT2ZO4QO8+mncgjepGDBWI1upn1Sl63SGYBTe4QK+IZVCUx1RG18JPbAMh9CQrOkEO3WsL/IYzIFunRQrimOKYE2fWC/TTfIbWBVsJ6ltTbVW798VjUvIrNBUL7K+otAwc6W6JB0/NFS/l5DpP2Wfq1elxvsIw5BK/viqUF9GvU0HDHbDH9xBorypFspYOUSmAwxOwQwkqggAAP//FrH0rgAAAAZJREFUAwCNUDkrZ9VfwgAAAABJRU5ErkJggg=='

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          borderRadius: '50%',
        }}
      >
        <img 
          src={base64Image} 
          style={{
            width: '70%',
            height: '70%',
            objectFit: 'contain'
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
