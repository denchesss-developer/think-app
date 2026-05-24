declare module 'react-simple-maps' {
    import * as React from 'react'

    type ProjectionValue = string | ((...args: unknown[]) => unknown)
    type GenericRecord = Record<string, unknown>

    export interface ComposableMapProps {
        width?: number
        height?: number
        projection?: ProjectionValue
        projectionConfig?: GenericRecord
        className?: string
        style?: React.CSSProperties
        children?: React.ReactNode
    }

    export interface GeographiesProps {
        geography?: string | object | string[]
        children: (data: { geographies: object[] }) => React.ReactNode
        className?: string
        parseGeographies?: (geographies: object[]) => object[]
    }

    export interface GeographyProps {
        geography: object
        fill?: string
        stroke?: string
        strokeWidth?: number | string
        className?: string
        style?: {
            default?: React.CSSProperties
            hover?: React.CSSProperties
            pressed?: React.CSSProperties
        }
        onMouseEnter?: (event: React.MouseEvent, geography: object) => void
        onMouseLeave?: (event: React.MouseEvent, geography: object) => void
        onMouseDown?: (event: React.MouseEvent, geography: object) => void
        onMouseUp?: (event: React.MouseEvent, geography: object) => void
        onFocus?: (event: React.FocusEvent, geography: object) => void
        onBlur?: (event: React.FocusEvent, geography: object) => void
        key?: string | number
    }

    export interface SphereProps {
        className?: string
        fill?: string
        stroke?: string
        strokeWidth?: number | string
        style?: React.CSSProperties
        id?: string
    }

    export interface GraticuleProps {
        className?: string
        fill?: string
        stroke?: string
        strokeWidth?: number | string
        style?: React.CSSProperties
        step?: [number, number]
        opacity?: number | string
    }

    export const ComposableMap: React.FC<ComposableMapProps>
    export const Geographies: React.FC<GeographiesProps>
    export const Geography: React.FC<GeographyProps>
    export const Sphere: React.FC<SphereProps>
    export const Graticule: React.FC<GraticuleProps>
}
