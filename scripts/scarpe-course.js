// https://golfbert.com/courses/holes/13555

const courseData = document.querySelectorAll('.bg-site-nav-link')

JSON.stringify(Array.from(courseData).reduce((acc, node, i) => {
    const children = node.children
    const MAP = {0: '#', 1: 'par', 2: 'yardage', 3: 'handicap'}
        
    const data = Array.from(children).reduce((_acc, child, j) => {
        const key = MAP[j]
        const value = child.innerHTML
        return {..._acc, [key]: value}
    }, {})

    return {...acc, [i]: data}
}, {}))