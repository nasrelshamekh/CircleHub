
import SuggestedCard from '../suggestedcard/SuggestedCard'
import SuggestedCommunitiesCard from '../suggestedcard/SuggestedCommunitiesCard'

export default function RightSidebar() {
    return (
        <>
            <div className="h-[calc(100vh-5rem)] top-20 space-y-6 pt-6 pr-6 w-full mx-auto">
                <SuggestedCard />
                <SuggestedCommunitiesCard />
            </div>
        </>
    )
}
